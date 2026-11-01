import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

import analyzeRouter from './routes/analyze.js';
import jobsRouter from './routes/jobs.js';
import filesRouter from './routes/files.js';
import healthRouter from './routes/health.js';
import robloxRouter from './routes/roblox.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

app.use('/api', apiRateLimiter);

app.use('/api/analyze', analyzeRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/files', filesRouter);
app.use('/api/health', healthRouter);
app.use('/api/roblox', robloxRouter);

const publicHtmlPath = path.join(process.cwd(), 'public_html');
const frontendOutPath = path.join(process.cwd(), '..', 'frontend', 'out');

const staticDir = fs.existsSync(publicHtmlPath)
  ? publicHtmlPath
  : fs.existsSync(frontendOutPath)
    ? frontendOutPath
    : null;

if (staticDir) {
  app.use(express.static(staticDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(indexPath);
    }
    return next();
  });
}

app.use(errorHandler);

export default app;
