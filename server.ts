import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes/api.ts';
import { errorHandler } from './server/middlewares/errorHandler.ts';
import { initSocketServer } from './server/sockets/chatSocket.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Basic security and parsing middlewares
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP server & Socket.io
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  // Mount API routes first
  app.use('/api', apiRouter);

  // Centralized Error handling
  app.use(errorHandler);

  // Vite middleware in development / static fallback in production
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
});
