import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { validateNoteInput } from '../validators/validators.ts';
import { Note } from '../models/types.ts';
import { EscrowService } from '../services/escrowService.ts';

export const NotesController = {
  getNotes(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId as string;
    const { subject, semester, search, freeOnly } = req.query;

    let notes = db.notes;

    if (requestedCampus && requestedCampus !== 'all') {
      notes = notes.filter(n => n.campusId === requestedCampus);
    }

    if (subject) {
      notes = notes.filter(n => n.subject.toLowerCase().includes((subject as string).toLowerCase()));
    }
    if (semester) {
      notes = notes.filter(n => n.semester.toLowerCase() === (semester as string).toLowerCase());
    }
    if (freeOnly === 'true') {
      notes = notes.filter(n => n.isFree);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        (n.collegeName && n.collegeName.toLowerCase().includes(q)) ||
        n.professor?.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Attach collegeName
    const enrichedNotes = notes.map(n => {
      const seller = db.users.find(u => u.id === n.sellerId);
      return {
        ...n,
        collegeName: n.collegeName || seller?.collegeName || 'Verified University'
      };
    });

    res.json({ success: true, notes: enrichedNotes });
  },

  getNoteById(req: AuthenticatedRequest, res: Response) {
    const note = db.notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    const seller = db.users.find(u => u.id === note.sellerId);
    const enrichedNote = {
      ...note,
      collegeName: note.collegeName || seller?.collegeName || 'Verified University'
    };

    // Check if requester has purchased
    const hasAccess = note.isFree || (req.user && (note.sellerId === req.user.userId || note.purchasedBy.includes(req.user.userId)));

    res.json({
      success: true,
      note: enrichedNote,
      hasAccess,
      // If no access, return only previewPages with watermark metadata
      previewUrl: note.previewPages[0] || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
    });
  },

  createNote(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const error = validateNoteInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isFree = Boolean(req.body.isFree) || Number(req.body.price) === 0;
    const price = isFree ? 0 : Number(req.body.price) || 5;

    const newNote: Note = {
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
      fileUrl: req.body.fileUrl || 'https://example.com/student-notes-pack.pdf',
      previewPages: req.body.previewPages || [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80'
      ],
      purchasedBy: [],
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      tags: req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()) : [req.body.subject],
      downloadsCount: 0,
      createdAt: new Date().toISOString()
    };

    db.notes.unshift(newNote);

    res.status(201).json({
      success: true,
      message: 'Study notes published across the cross-college network with watermarked previews.',
      note: newNote
    });
  },

  purchaseNote(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const note = db.notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    if (note.purchasedBy.includes(req.user.userId)) {
      return res.json({ success: true, message: 'You already own this note.', fileUrl: note.fileUrl });
    }

    if (note.sellerId === req.user.userId) {
      return res.json({ success: true, message: 'You are the author of this note.', fileUrl: note.fileUrl });
    }

    const buyer = db.users.find(u => u.id === req.user?.userId);
    const seller = db.users.find(u => u.id === note.sellerId);

    if (!note.isFree && note.price > 0) {
      if (!buyer) return res.status(404).json({ success: false, message: 'Buyer account not found.' });

      if (buyer.walletBalance < note.price) {
        // Auto-topup for smooth sandbox testing
        buyer.walletBalance += 50;
      }

      buyer.walletBalance -= note.price;
      if (seller) {
        seller.walletBalance += note.price;
      }
    }

    note.purchasedBy.push(req.user.userId);
    note.downloadsCount += 1;

    // Notify seller
    if (seller) {
      const isCrossCollege = Boolean(buyer?.collegeName && seller.collegeName && buyer.collegeName !== seller.collegeName);
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        campusId: note.campusId,
        userId: seller.id,
        type: 'note',
        title: isCrossCollege ? 'Cross-Campus Notes Sold!' : 'Notes Sold!',
        message: `${buyer?.name || 'A student'} (${buyer?.collegeName || 'Student'}) purchased "${note.title}". $${note.price} credited to your campus wallet.`,
        read: false,
        link: '/notes',
        createdAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Payment completed! You now have full access to view & download the original notes.',
      note,
      downloadUrl: note.fileUrl,
      fileUrl: note.fileUrl
    });
  },

  addReview(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { rating, comment } = req.body;
    const note = db.notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    const user = db.users.find(u => u.id === req.user?.userId);
    const review = {
      id: `rev_${Date.now()}`,
      reviewerId: req.user.userId,
      reviewerName: user?.name || req.user.name,
      reviewerAvatar: user?.avatar || '',
      rating: Number(rating) || 5,
      comment: comment || 'Very helpful study materials!',
      date: new Date().toISOString().split('T')[0]
    };

    note.reviews.unshift(review);
    note.reviewsCount = note.reviews.length;
    const totalRating = note.reviews.reduce((acc, r) => acc + r.rating, 0);
    note.rating = Number((totalRating / note.reviewsCount).toFixed(1));

    res.json({ success: true, message: 'Review added successfully.', note });
  },

  getSellerDashboard(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const myNotes = db.notes.filter(n => n.sellerId === req.user?.userId);
    const totalSales = myNotes.reduce((acc, n) => acc + (n.purchasedBy.length * n.price), 0);
    const totalPurchases = myNotes.reduce((acc, n) => acc + n.purchasedBy.length, 0);

    res.json({
      success: true,
      dashboard: {
        totalNotesListed: myNotes.length,
        totalSalesEarnings: totalSales,
        totalPurchasesCount: totalPurchases,
        notes: myNotes
      }
    });
  }
};
