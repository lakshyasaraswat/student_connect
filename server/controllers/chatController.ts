import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { getSocketIO } from '../sockets/chatSocket.ts';
import {
  ChatMessageModel,
  UserModel,
  AppNotificationModel,
  RoommatePostModel,
  PGListingModel,
  EquipmentModel,
  AssignmentModel,
} from '../models/schemas.ts';

export const ChatController = {
  async getRoomMessages(req: AuthenticatedRequest, res: Response) {
    const { roomId } = req.params;
    const messages = await ChatMessageModel
      .find({ roomId })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, messages });
  },

  async postMessage(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { roomId, text } = req.body;
    if (!roomId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and message text are required.',
      });
    }

    const user = await UserModel.findOne({ id: req.user.userId }).lean();

    const newMsg = await ChatMessageModel.create({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user?.campusId || 'campus_stanford',
      roomId,
      senderId: req.user.userId,
      senderName: user?.name || req.user.name,
      senderAvatar: user?.avatar || '',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });

    const msgJson = newMsg.toObject();

    // Real-time broadcast to any active sockets connected to this room
    const io = getSocketIO();
    if (io) {
      io.to(roomId).emit('new_message', msgJson);
      io.to(roomId).emit('newMessage', msgJson);
    }

    // Determine target recipient for notifications
    let recipientUserId: string | null = null;
    let notifTitle = 'New Message';
    const notifBody = `${msgJson.senderName}: ${msgJson.text.slice(0, 60)}`;

    if (roomId.startsWith('roommate_')) {
      const postId = roomId.replace('roommate_', '');
      const post = await RoommatePostModel.findOne({ id: postId }).lean();
      if (post && post.userId !== req.user.userId) {
        recipientUserId = post.userId;
        notifTitle = `💬 Roommate Message from ${msgJson.senderName}`;
      }
    } else if (roomId.startsWith('listing_')) {
      const listingId = roomId.replace('listing_', '');
      const listing = await PGListingModel.findOne({ id: listingId }).lean();
      if (listing && listing.ownerId !== req.user.userId) {
        recipientUserId = listing.ownerId;
        notifTitle = `🏠 Housing Inquiry from ${msgJson.senderName}`;
      }
    } else if (roomId.startsWith('equipment_')) {
      const equipmentId = roomId.replace('equipment_', '');
      const item = await EquipmentModel.findOne({ id: equipmentId }).lean();
      if (item && item.ownerId !== req.user.userId) {
        recipientUserId = item.ownerId;
        notifTitle = `🔧 Equipment Inquiry from ${msgJson.senderName}`;
      }
    } else if (roomId.startsWith('assignment_')) {
      const assignmentId = roomId.replace('assignment_', '');
      const assignment = await AssignmentModel.findOne({ id: assignmentId }).lean();
      if (assignment) {
        if (req.user.userId === assignment.studentId && assignment.solverId) {
          recipientUserId = assignment.solverId;
          notifTitle = `📝 Assignment Help: ${assignment.title}`;
        } else if (req.user.userId !== assignment.studentId) {
          recipientUserId = assignment.studentId;
          notifTitle = `📝 Assignment Help Query from ${msgJson.senderName}`;
        }
      }
    }

    if (recipientUserId) {
      const notif = await AppNotificationModel.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        campusId: user?.campusId || 'campus_stanford',
        userId: recipientUserId,
        type: 'roommate',
        title: notifTitle,
        message: notifBody,
        read: false,
        createdAt: new Date().toISOString(),
      });

      if (io) {
        io.to(`user_${recipientUserId}`).emit('notification', notif.toObject());
      }
    }

    res.status(201).json({ success: true, message: msgJson });
  },
};