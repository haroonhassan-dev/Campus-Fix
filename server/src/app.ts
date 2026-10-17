import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './errors.ts';
import { complaintsRouter } from './routes/complaints.ts';
import type { ComplaintStore } from './store.ts';

export function createApp(store: ComplaintStore, corsOrigins: string[]): Express {
  const app = express();
  app.disable('x-powered-by');

  // Only listed origins get CORS headers; others are blocked by the browser
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    })
  );
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      data: {
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        complaints: store.count(),
      },
    });
  });

  app.use('/api/complaints', complaintsRouter(store));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
