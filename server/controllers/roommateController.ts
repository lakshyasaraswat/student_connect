import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { RoommatePostModel, UserModel } from '../models/schemas.ts';
import { calculateCompatibilityScore } from '../services/compatibilityService.ts';

export const RoommateController = {
  async getRoommates(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId ? String(req.query.campusId) : undefined;
    const campusId =
      (req.user?.role === 'admin' && requestedCampus) ||
      requestedCampus ||
      req.user?.campusId;

    const status = req.query.status ? String(req.query.status) : 'looking';
    const preferredGender = req.query.preferredGender
      ? String(req.query.preferredGender)
      : undefined;

    const filter: any = {};
    if (campusId && campusId !== 'all') filter.campusId = campusId;
    if (status !== 'all') filter.status = status;

    let posts = await RoommatePostModel.find(filter).sort({ createdAt: -1 }).lean();

    if (preferredGender && preferredGender !== 'all') {
      const g = preferredGender.toLowerCase();
      posts = posts.filter(
        (r: any) =>
          r.preferredLocation?.toLowerCase() === g ||
          r.userGender?.toLowerCase() === g
      );
    }

    // If current logged-in user has a roommate post, calculate compatibility for every candidate
    const myPost = req.user
      ? await RoommatePostModel.findOne({ userId: req.user.userId }).lean()
      : null;

    const enriched = posts.map((post: any) => {
      let compatibility: { score: number; breakdown: any[] } | null = null;

      if (myPost && (myPost as any).id !== post.id) {
        compatibility = calculateCompatibilityScore(
          (myPost as any).preferences,
          post.preferences,
          { min: (myPost as any).budgetMin, max: (myPost as any).budgetMax },
          { min: post.budgetMin, max: post.budgetMax }
        );
      } else {
        compatibility = {
          score: 85,
          breakdown: [
            { category: 'Campus Alignment', points: 25, max: 25, match: true },
            { category: 'Budget Range', points: 20, max: 25, match: true },
            { category: 'Lifestyle', points: 40, max: 50, match: true },
          ],
        };
      }

      return {
        ...post,
        compatibilityScore: compatibility.score,
        compatibilityBreakdown: compatibility.breakdown,
      };
    });

    enriched.sort(
      (a: any, b: any) => b.compatibilityScore - a.compatibilityScore
    );

    res.json({ success: true, roommates: enriched, myPost });
  },

  async createOrUpdatePost(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const {
      userGender = 'Female',
      budgetMin = 800,
      budgetMax = 1200,
      preferredLocation = 'Near Campus',
      mapsUrl,
      preferences,
      bio,
      contactPreferences,
    } = req.body;

    const existing = await RoommatePostModel.findOne({ userId: user.id });

    const postData: any = {
      id: existing
        ? existing.id
        : `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userGender: userGender || 'Other',
      course: user.course || 'Undergraduate Degree',
      year: user.year || '1st Year',
      budgetMin: Number(budgetMin) || 700,
      budgetMax: Number(budgetMax) || 1200,
      preferredLocation: preferredLocation || 'Campus Vicinity',
      mapsUrl: mapsUrl ? mapsUrl.trim() : undefined,
      preferences: {
        preferredGender: preferences?.preferredGender || 'Any',
        smoking: preferences?.smoking || 'Non-Smoker',
        food: preferences?.food || 'Any',
        sleepSchedule: preferences?.sleepSchedule || 'Early Bird (before 11 PM)',
        cleanliness: preferences?.cleanliness || 'Moderate',
        studyHabit: preferences?.studyHabit || 'Quiet Study',
      },
      bio: bio || user.bio || 'Seeking a compatible roommate for next semester.',
      status: 'looking',
      contactPreferences:
        contactPreferences || `In-app chat or ${user.email}`,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    const post = existing
      ? await RoommatePostModel.findOneAndUpdate(
        { id: existing.id },
        postData,
        { new: true }
      ).lean()
      : await RoommatePostModel.create(postData);

    res.json({
      success: true,
      message:
        'Roommate preferences posted! AI compatibility matching is now active for your profile.',
      post,
    });
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const post = await RoommatePostModel.findOne({ id });
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found.' });

    if (post.userId !== req.user.userId && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized to modify this post.' });
    }

    post.status = req.body.status === 'found' ? 'found' : 'looking';
    await post.save();

    res.json({
      success: true,
      message: `Status updated to '${post.status}'.`,
      post: post.toObject(),
    });
  },

  async deletePost(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const post = await RoommatePostModel.findOne({ id }).lean();
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: 'Roommate post not found.' });

    if (post.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own roommate post.',
      });
    }

    await RoommatePostModel.deleteOne({ id });
    res.json({ success: true, message: 'Roommate post removed successfully.' });
  },
};