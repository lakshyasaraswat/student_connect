import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import mongoose from 'mongoose';                          // ← add
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes/api.ts';
import { errorHandler } from './server/middlewares/errorHandler.ts';
import { initSocketServer } from './server/sockets/chatSocket.ts';

import 'dotenv/config';
import { connectDB } from './server/config/db.ts';
import { seedIfEmpty } from './server/config/seed.ts';

async function startServer() {
  // ✅ Connect to MongoDB FIRST — before routes touch the DB
  await connectDB();
  await seedIfEmpty();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  // Health check — verify DB connection in the browser
  app.get('/health/db', (_req, res) => {
    res.json({
      readyState: mongoose.connection.readyState,   // 1 = connected
      host: mongoose.connection.host,
      db: mongoose.connection.name,
    });
  });

  app.use('/api', apiRouter);
  app.use(errorHandler);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Student_Connect] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});