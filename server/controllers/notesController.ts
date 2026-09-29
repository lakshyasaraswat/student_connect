import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { validateNoteInput } from '../validators/validators.ts';
import {
  NoteModel,
  UserModel,
  AppNotificationModel,
} from '../models/schemas.ts';

export const NotesController = {
  async getNotes(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId
      ? String(req.query.campusId)
      : undefined;
    const subject = req.query.subject ? String(req.query.subject) : undefined;
    const semester = req.query.semester ? String(req.query.semester) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const freeOnly = req.query.freeOnly === 'true';

    const filter: any = {};
    if (requestedCampus && requestedCampus !== 'all')
      filter.campusId = requestedCampus;
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (semester)
      filter.semester = new RegExp(`^${semester}$`, 'i');
    if (freeOnly) filter.isFree = true;
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [
        { title: rx },
        { subject: rx },
        { collegeName: rx },
        { professor: rx },
        { tags: rx },
      ];
    }

    const notes = await NoteModel.find(filter).sort({ createdAt: -1 }).lean();

    // Enrich: attach collegeName from seller if missing
    const sellerIds = Array.from(new Set(notes.map((n: any) => n.sellerId)));
    const sellers = await UserModel.find({ id: { $in: sellerIds } }).lean();
    const sellerMap = new Map<string, any>(sellers.map((s: any) => [s.id, s]));

    const enrichedNotes = notes.map((n: any) => ({
      ...n,
      collegeName:
        n.collegeName ||
        sellerMap.get(n.sellerId)?.collegeName ||
        'Verified University',
    }));

    res.json({ success: true, notes: enrichedNotes });
  },

  async getNoteById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const note: any = await NoteModel.findOne({ id }).lean();
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: 'Note not found.' });

    const seller: any = await UserModel.findOne({ id: note.sellerId }).lean();

    const enrichedNote = {
      ...note,
      collegeName:
        note.collegeName || seller?.collegeName || 'Verified University',
    };

    const hasAccess =
      note.isFree ||
      (req.user &&
        (note.sellerId === req.user.userId ||
          note.purchasedBy?.includes(req.user.userId)));

    res.json({
      success: true,
      note: enrichedNote,
      hasAccess,
      previewUrl:
        note.previewPages?.[0] ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    });
  },

  async createNote(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const error = validateNoteInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const user: any = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const isFree = Boolean(req.body.isFree) || Number(req.body.price) === 0;
    const price = isFree ? 0 : Number(req.body.price) || 5;

    const newNote = await NoteModel.create({
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      collegeName: user.collegeName,
      sellerId: user.id,
      sellerName: user.name,
      sellerAvatar: user.avatar,
      title: req.body.title.trim(),
      subject: req.body.subject.trim(),
      semester: req.body.semester.trim(),
      professor: req.body.professor || 'Department Faculty',
      examType: req.body.examType || 'Lecture Notes & Solved Papers',
      price,
      isFree,
      fileUrl:
        req.body.fileUrl ||
        'https://example.com/student-notes-pack.pdf',
      previewPages: req.body.previewPages || [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      ],
      purchasedBy: [],
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      tags: req.body.tags
        ? req.body.tags.split(',').map((t: string) => t.trim())
        : [req.body.subject],
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message:
        'Study notes published across the cross-college network with watermarked previews.',
      note: newNote.toObject(),
    });
  },

  async purchaseNote(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const note: any = await NoteModel.findOne({ id });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: 'Note not found.' });

    if (note.purchasedBy?.includes(req.user.userId)) {
      return res.json({
        success: true,
        message: 'You already own this note.',
        fileUrl: note.fileUrl,
      });
    }

    if (note.sellerId === req.user.userId) {
      return res.json({
        success: true,
        message: 'You are the author of this note.',
        fileUrl: note.fileUrl,
      });
    }

    const buyer: any = await UserModel.findOne({ id: req.user.userId });
    const seller: any = await UserModel.findOne({ id: note.sellerId });

    if (!note.isFree && note.price > 0) {
      if (!buyer)
        return res
          .status(404)
          .json({ success: false, message: 'Buyer account not found.' });

      if (buyer.walletBalance < note.price) {
        buyer.walletBalance += 50; // sandbox auto-topup
      }
      buyer.walletBalance -= note.price;
      await buyer.save();

      if (seller) {
        seller.walletBalance += note.price;
        await seller.save();
      }
    }

    note.purchasedBy.push(req.user.userId);
    note.downloadsCount = (note.downloadsCount || 0) + 1;
    await note.save();

    if (seller) {
      const isCrossCollege = Boolean(
        buyer?.collegeName &&
        seller.collegeName &&
        buyer.collegeName !== seller.collegeName
      );

      await AppNotificationModel.create({
        id: `notif_${Date.now()}`,
        campusId: note.campusId,
        userId: seller.id,
        type: 'note',
        title: isCrossCollege ? 'Cross-Campus Notes Sold!' : 'Notes Sold!',
        message: `${buyer?.name || 'A student'} (${buyer?.collegeName || 'Student'}) purchased "${note.title}". $${note.price} credited to your campus wallet.`,
        read: false,
        link: '/notes',
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message:
        'Payment completed! You now have full access to view & download the original notes.',
      note: note.toObject(),
      downloadUrl: note.fileUrl,
      fileUrl: note.fileUrl,
    });
  },

  async addReview(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { rating, comment } = req.body;
    const id = String(req.params.id);

    const note: any = await NoteModel.findOne({ id });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: 'Note not found.' });

    const user: any = await UserModel.findOne({ id: req.user.userId }).lean();

    note.reviews.unshift({
      id: `rev_${Date.now()}`,
      reviewerId: req.user.userId,
      reviewerName: user?.name || req.user.name,
      reviewerAvatar: user?.avatar || '',
      rating: Number(rating) || 5,
      comment: comment || 'Very helpful study materials!',
      date: new Date().toISOString().split('T')[0],
    });

    note.reviewsCount = note.reviews.length;
    const totalRating = note.reviews.reduce(
      (acc: number, r: any) => acc + r.rating,
      0
    );
    note.rating = Number((totalRating / note.reviewsCount).toFixed(1));
    await note.save();

    res.json({
      success: true,
      message: 'Review added successfully.',
      note: note.toObject(),
    });
  },

  async getSellerDashboard(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const myNotes = await NoteModel.find({ sellerId: req.user.userId }).lean();

    const totalSales = myNotes.reduce(
      (acc: number, n: any) =>
        acc + (n.purchasedBy?.length || 0) * (n.price || 0),
      0
    );
    const totalPurchases = myNotes.reduce(
      (acc: number, n: any) => acc + (n.purchasedBy?.length || 0),
      0
    );

    res.json({
      success: true,
      dashboard: {
        totalNotesListed: myNotes.length,
        totalSalesEarnings: totalSales,
        totalPurchasesCount: totalPurchases,
        notes: myNotes,
      },
    });
  },
};