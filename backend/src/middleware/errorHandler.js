/**
 * Centralized Global Error Handler Middleware
 */

export function errorHandler(err, req, res, next) {
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
