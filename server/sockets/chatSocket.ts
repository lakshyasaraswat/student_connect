import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { UserModel, ChatMessageModel } from '../models/schemas.ts';

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    const campusId = socket.handshake.query.campusId as string | undefined;
    const userId = socket.handshake.query.userId as string | undefined;

    if (campusId) socket.join(`campus_${campusId}`);
    if (userId) socket.join(`user_${userId}`);

    // Join specific feature chat room
    const handleJoin = (data: any) => {
      const room = typeof data === 'string' ? data : data?.roomId;
      if (room) socket.join(room);
    };
    socket.on('join_room', handleJoin);
    socket.on('joinRoom', handleJoin);

    const handleLeave = (data: any) => {
      const room = typeof data === 'string' ? data : data?.roomId;
      if (room) socket.leave(room);
    };
    socket.on('leave_room', handleLeave);
    socket.on('leaveRoom', handleLeave);

    // Handle real-time chat messages
    const handleMessage = async (data: {
      roomId: string;
      campusId?: string;
      senderId: string;
      senderName: string;
      senderAvatar?: string;
      text: string;
    }) => {
      if (!data?.roomId || !data?.text?.trim()) return;

      try {
        const user = await UserModel.findOne({ id: data.senderId }).lean();

        const message = await ChatMessageModel.create({
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          campusId: data.campusId || user?.campusId || 'campus_stanford',
          roomId: data.roomId,
          senderId: data.senderId,
          senderName: data.senderName || user?.name || 'Student',
          senderAvatar: data.senderAvatar || user?.avatar || '',
          text: data.text.trim(),
          createdAt: new Date().toISOString(),
        });

        const payload = message.toObject();

        // ⚠️ FIXED: Only emit ONCE, using the canonical event name.
        // Emitting both 'new_message' and 'newMessage' causes the
        // receiver (and sender) to process the same message twice.
        io.to(data.roomId).emit('new_message', payload);
      } catch (err) {
        console.error('[chatSocket] handleMessage error:', err);
      }
    };

    socket.on('send_message', handleMessage);
    socket.on('sendMessage', handleMessage);

    // Typing status
    socket.on(
      'typing',
      (data: { roomId: string; userName: string; isTyping: boolean }) => {
        socket.to(data.roomId).emit('user_typing', data);
      }
    );

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

export function broadcastRideUpdate(
  ride: any,
  targetDriverId?: string,
  passengerRecord?: any
) {
  if (ioInstance) {
    ioInstance.emit('ride_updated', { rideId: ride.id, ride });
    if (targetDriverId) {
      ioInstance.to(`user_${targetDriverId}`).emit('ride_request_received', {
        rideId: ride.id,
        ride,
        passengerRecord,
      });
    }
  }
}

export function broadcastRideWithdrawal(
  ride: any,
  targetDriverId: string,
  passengerId: string
) {
  if (ioInstance) {
    ioInstance.emit('ride_updated', { rideId: ride.id, ride });
    ioInstance.to(`user_${targetDriverId}`).emit('ride_request_withdrawn', {
      rideId: ride.id,
      ride,
      passengerId,
    });
  }
}

export function broadcastRideDecision(
  ride: any,
  passengerId: string,
  status: string
) {
  if (ioInstance) {
    ioInstance.emit('ride_updated', { rideId: ride.id, ride });
    ioInstance.to(`user_${passengerId}`).emit('ride_status_updated', {
      rideId: ride.id,
      ride,
      status,
    });
  }
}

export function broadcastAssignmentUpdate(
  assignment: any,
  targetUserId?: string,
  eventName?: string,
  extraData?: any
) {
  if (ioInstance) {
    ioInstance.emit('assignment_updated', {
      assignmentId: assignment.id,
      assignment,
    });
    if (targetUserId && eventName) {
      ioInstance.to(`user_${targetUserId}`).emit(eventName, {
        assignmentId: assignment.id,
        assignment,
        ...extraData,
      });
    }
  }
}