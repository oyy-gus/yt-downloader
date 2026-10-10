/**
 * Express Application Assembly
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

import analyzeRouter from './routes/analyze.js';
import jobsRouter from './routes/jobs.js';
import filesRouter from './routes/files.js';
import healthRouter from './routes/health.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy headers (Koyeb, Vercel, Cloudflare)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply Rate Limiter to API routes
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/files', filesRouter);
app.use('/api/health', healthRouter);

import fs from 'fs';

// Serve Static Frontend (Single-Host Deployment)
const publicHtmlPath = path.join(process.cwd(), 'public_html');
const frontendOutPath = path.join(process.cwd(), '..', 'frontend', 'out');

const staticDir = fs.existsSync(publicHtmlPath)
  ? publicHtmlPath
  : fs.existsSync(frontendOutPath)
    ? frontendOutPath
    : null;

if (staticDir) {
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

export default app;
