import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): any {
  console.error('[Maxistrong API Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal server error occurred'
    : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: message
  });
}
