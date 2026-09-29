import { Router } from 'express';
import authRoutes from './authRoutes.ts';
import rideRoutes from './rideRoutes.ts';
import notesRoutes from './notesRoutes.ts';
import equipmentRoutes from './equipmentRoutes.ts';
import tutoringRoutes from './tutoringRoutes.ts';
import studyGroupRoutes from './studyGroupRoutes.ts';
import roommateRoutes from './roommateRoutes.ts';
import listingRoutes from './listingRoutes.ts';
import adminRoutes from './adminRoutes.ts';
import notificationRoutes from './notificationRoutes.ts';
import chatRoutes from './chatRoutes.ts';
import geminiRoutes from './geminiRoutes.ts';
import assignmentRoutes from './assignmentRoutes.ts';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Student_Connect',
    stack: 'MERN (Node, Express, React, Vite)',
    timestamp: new Date().toISOString()
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/rides', rideRoutes);
apiRouter.use('/notes', notesRoutes);
apiRouter.use('/equipment', equipmentRoutes);
apiRouter.use('/tutoring', tutoringRoutes);
apiRouter.use('/study-groups', studyGroupRoutes);
apiRouter.use('/roommates', roommateRoutes);
apiRouter.use('/listings', listingRoutes);
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/gemini', geminiRoutes);

export default apiRouter;
