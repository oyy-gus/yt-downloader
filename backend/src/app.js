/**
 * Express Application Assembly
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config(); // fallback to root .env if present

import analyzeRouter from './routes/analyze.js';
import jobsRouter from './routes/jobs.js';
import filesRouter from './routes/files.js';
import healthRouter from './routes/health.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: [frontendUrl, 'http://localhost:3000'],
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

// Global Error Handler
app.use(errorHandler);

export default app;
