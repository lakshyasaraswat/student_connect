import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from '../config/db.ts';
import { ChatMessage } from '../models/types.ts';

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    const campusId = socket.handshake.query.campusId as string;
    const userId = socket.handshake.query.userId as string;

    if (campusId) {
      socket.join(`campus_${campusId}`);
    }
    if (userId) {
      socket.join(`user_${userId}`);
    }

    // Join specific feature chat room (e.g. ride_ride_1, group_group_1, dm_user1_user2)
    const handleJoin = (data: any) => {
      const room = typeof data === 'string' ? data : data?.roomId;
      if (room) {
        socket.join(room);
      }
    };
    socket.on('join_room', handleJoin);
    socket.on('joinRoom', handleJoin);

    const handleLeave = (data: any) => {
      const room = typeof data === 'string' ? data : data?.roomId;
      if (room) {
        socket.leave(room);
      }
    };
    socket.on('leave_room', handleLeave);
    socket.on('leaveRoom', handleLeave);

    // Handle real-time chat messages (supporting both snake_case and camelCase formats)
    const handleMessage = (data: {
      roomId: string;
      campusId?: string;
      senderId: string;
      senderName: string;
      senderAvatar?: string;
      text: string;
    }) => {
      if (!data?.roomId || !data?.text?.trim()) return;

      const user = db.users.find(u => u.id === data.senderId);
      const message: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        campusId: data.campusId || user?.campusId || 'campus_stanford',
        roomId: data.roomId,
        senderId: data.senderId,
        senderName: data.senderName || user?.name || 'Student',
        senderAvatar: data.senderAvatar || user?.avatar || '',
        text: data.text.trim(),
        createdAt: new Date().toISOString()
      };

      db.chatMessages.push(message);

      // Broadcast to all sockets in this room (both event names for full compatibility)
      io.to(data.roomId).emit('new_message', message);
      io.to(data.roomId).emit('newMessage', message);
    };

    socket.on('send_message', handleMessage);
    socket.on('sendMessage', handleMessage);

    // Handle typing status
    socket.on('typing', (data: { roomId: string; userName: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('user_typing', data);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export function sendRealTimeNotification(userId: string, notification: any) {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('notification', notification);
  }
}

export function broadcastRideUpdate(ride: any, targetDriverId?: string, passengerRecord?: any) {
  if (ioInstance) {
    ioInstance.emit('ride_updated', { rideId: ride.id, ride });
    if (targetDriverId) {
      ioInstance.to(`user_${targetDriverId}`).emit('ride_request_received', {
        rideId: ride.id,
        ride,
        passengerRecord
      });
    }
  }
}

export function broadcastRideWithdrawal(ride: any, targetDriverId: string, passengerId: string) {
  if (ioInstance) {
    ioInstance.emit('ride_updated', { rideId: ride.id, ride });
    ioInstance.to(`user_${targetDriverId}`).emit('ride_request_withdrawn', {
      rideId: ride.id,
      ride,
      passengerId
    });
  }
}

export function broadcastRideDecision(ride: any, passengerId: string, status: string) {
  if (ioInstance) {
    ioInstance.emit('ride_updated', { rideId: ride.id, ride });
    ioInstance.to(`user_${passengerId}`).emit('ride_status_updated', {
      rideId: ride.id,
      ride,
      status
    });
  }
}

export function broadcastAssignmentUpdate(assignment: any, targetUserId?: string, eventName?: string, extraData?: any) {
  if (ioInstance) {
    ioInstance.emit('assignment_updated', { assignmentId: assignment.id, assignment });
    if (targetUserId && eventName) {
      ioInstance.to(`user_${targetUserId}`).emit(eventName, {
        assignmentId: assignment.id,
        assignment,
        ...extraData
      });
    }
  }
}

