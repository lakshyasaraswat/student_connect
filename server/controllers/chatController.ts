import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { getSocketIO } from '../sockets/chatSocket.ts';

export const ChatController = {
  getRoomMessages(req: AuthenticatedRequest, res: Response) {
    const { roomId } = req.params;
    const messages = db.chatMessages.filter(m => m.roomId === roomId);
    res.json({ success: true, messages });
  },

  postMessage(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { roomId, text } = req.body;
    if (!roomId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'Room ID and message text are required.' });
    }

    const user = db.users.find(u => u.id === req.user?.userId);
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user?.campusId || 'campus_stanford',
      roomId,
      senderId: req.user.userId,
      senderName: user?.name || req.user.name,
      senderAvatar: user?.avatar || '',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    db.chatMessages.push(newMsg);

    // Real-time broadcast to any active sockets connected to this room
    const io = getSocketIO();
    if (io) {
      io.to(roomId).emit('new_message', newMsg);
      io.to(roomId).emit('newMessage', newMsg);
    }

    // Determine target recipient for notifications (e.g. roommate post owner, housing listing host)
    let recipientUserId: string | null = null;
    let notifTitle = 'New Message';
    let notifBody = `${newMsg.senderName}: ${newMsg.text.slice(0, 60)}`;

    if (roomId.startsWith('roommate_')) {
      const postId = roomId.replace('roommate_', '');
      const post = db.roommates.find(r => r.id === postId);
      if (post && post.userId !== req.user.userId) {
        recipientUserId = post.userId;
        notifTitle = `💬 Roommate Message from ${newMsg.senderName}`;
      }
    } else if (roomId.startsWith('listing_')) {
      const listingId = roomId.replace('listing_', '');
      const listing = db.listings.find(l => l.id === listingId);
      if (listing && listing.ownerId !== req.user.userId) {
        recipientUserId = listing.ownerId;
        notifTitle = `🏠 Housing Inquiry from ${newMsg.senderName}`;
      }
    } else if (roomId.startsWith('equipment_')) {
      const equipmentId = roomId.replace('equipment_', '');
      const item = db.equipment.find(e => e.id === equipmentId);
      if (item && item.ownerId !== req.user.userId) {
        recipientUserId = item.ownerId;
        notifTitle = `🔧 Equipment Inquiry from ${newMsg.senderName}`;
      }
    } else if (roomId.startsWith('assignment_')) {
      const assignmentId = roomId.replace('assignment_', '');
      const assignment = db.assignments.find(a => a.id === assignmentId);
      if (assignment) {
        if (req.user.userId === assignment.studentId && assignment.solverId) {
          recipientUserId = assignment.solverId;
          notifTitle = `📝 Assignment Help: ${assignment.title}`;
        } else if (req.user.userId !== assignment.studentId) {
          recipientUserId = assignment.studentId;
          notifTitle = `📝 Assignment Help Query from ${newMsg.senderName}`;
        }
      }
    }

    if (recipientUserId) {
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        campusId: user?.campusId || 'campus_stanford',
        userId: recipientUserId,
        type: 'roommate' as any,
        title: notifTitle,
        message: notifBody,
        read: false,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(notif);
      if (io) {
        io.to(`user_${recipientUserId}`).emit('notification', notif);
      }
    }

    res.status(201).json({ success: true, message: newMsg });
  }
};
