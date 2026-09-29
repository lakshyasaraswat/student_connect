import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { RoommatePost } from '../models/types.ts';
import { calculateCompatibilityScore } from '../services/compatibilityService.ts';

export const RoommateController = {
  getRoommates(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId as string;
    const campusId = (req.user?.role === 'admin' && requestedCampus) || requestedCampus || req.user?.campusId;
    const { status = 'looking', preferredGender } = req.query;

    let posts = db.roommates;
    if (campusId && campusId !== 'all') {
      posts = posts.filter(r => r.campusId === campusId);
    }

    if (status !== 'all') {
      posts = posts.filter(r => r.status === status);
    }
    if (preferredGender && preferredGender !== 'all') {
      posts = posts.filter(r => r.preferredLocation.toLowerCase() === (preferredGender as string).toLowerCase() || r.userGender.toLowerCase() === (preferredGender as string).toLowerCase());
    }

    // If current logged-in user has a roommate post, calculate compatibility score for every candidate!
    const myPost = req.user ? db.roommates.find(r => r.userId === req.user?.userId) : null;

    const enriched = posts.map(post => {
      let compatibility: { score: number; breakdown: any[] } | null = null;
      if (myPost && myPost.id !== post.id) {
        compatibility = calculateCompatibilityScore(
          myPost.preferences,
          post.preferences,
          { min: myPost.budgetMin, max: myPost.budgetMax },
          { min: post.budgetMin, max: post.budgetMax }
        );
      } else {
        // Default baseline compatibility score
        compatibility = {
          score: 85,
          breakdown: [
            { category: 'Campus Alignment', points: 25, max: 25, match: true },
            { category: 'Budget Range', points: 20, max: 25, match: true },
            { category: 'Lifestyle', points: 40, max: 50, match: true }
          ]
        };
      }

      return {
        ...post,
        compatibilityScore: compatibility.score,
        compatibilityBreakdown: compatibility.breakdown
      };
    });

    // Sort by compatibility score descending
    enriched.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({ success: true, roommates: enriched, myPost });
  },

  createOrUpdatePost(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const {
      userGender = 'Female',
      budgetMin = 800,
      budgetMax = 1200,
      preferredLocation = 'Near Campus',
      mapsUrl,
      preferences,
      bio,
      contactPreferences
    } = req.body;

    const existingIndex = db.roommates.findIndex(r => r.userId === user.id);

    const postData: RoommatePost = {
      id: existingIndex >= 0 ? db.roommates[existingIndex].id : `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
        studyHabit: preferences?.studyHabit || 'Quiet Study'
      },
      bio: bio || user.bio || 'Seeking a compatible roommate for next semester.',
      status: 'looking',
      contactPreferences: contactPreferences || `In-app chat or ${user.email}`,
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      db.roommates[existingIndex] = postData;
    } else {
      db.roommates.unshift(postData);
    }

    res.json({
      success: true,
      message: 'Roommate preferences posted! AI compatibility matching is now active for your profile.',
      post: postData
    });
  },

  updateStatus(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const post = db.roommates.find(r => r.id === req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    if (post.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this post.' });
    }

    post.status = req.body.status === 'found' ? 'found' : 'looking';
    res.json({ success: true, message: `Status updated to '${post.status}'.`, post });
  },

  deletePost(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const index = db.roommates.findIndex(r => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Roommate post not found.' });

    const post = db.roommates[index];
    if (post.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own roommate post.' });
    }

    db.roommates.splice(index, 1);
    res.json({ success: true, message: 'Roommate post removed successfully.' });
  }
};
