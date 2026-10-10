/**
 * Express Application Assembly
 */

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
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy headers (Koyeb, Cloudflare, etc.)
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

// API Routes (MUST be registered before static/catch-all)
app.use('/api/analyze', analyzeRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/files', filesRouter);
app.use('/api/health', healthRouter);

// Serve Static Frontend (Single-Host Deployment)
const publicHtmlPath = path.join(process.cwd(), 'public_html');
const frontendOutPath = path.join(process.cwd(), '..', 'frontend', 'out');

const staticDir = fs.existsSync(publicHtmlPath)
  ? publicHtmlPath
  : fs.existsSync(frontendOutPath)
    ? frontendOutPath
    : null;

if (staticDir) {
  // Serve static assets (_next/, images, etc.)
  app.use(express.static(staticDir));

  // Catch-all: serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });
}

// Global Error Handler (MUST be last)
app.use(errorHandler);

export default app;
