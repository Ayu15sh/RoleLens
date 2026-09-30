import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error with HTTP status code.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Central error handling middleware.
 * Catches all errors and returns consistent JSON error responses.
 *
 * Handles:
 * - AppError (known application errors with status codes)
 * - Zod validation errors (malformed requests)
 * - OpenAI API errors (embedding/LLM failures)
 * - Database errors (connection, query failures)
 * - Unknown errors (500 Internal Server Error)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Known application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // OpenAI API errors
  if (err.message?.includes('API key')) {
    res.status(503).json({
      error: 'AIServiceError',
      message: 'AI service configuration error. Check that LLM_API_KEY is set correctly.',
      statusCode: 503,
    });
    return;
  }

  if (err.message?.includes('embedding') || err.message?.includes('LLM')) {
    res.status(502).json({
      error: 'AIServiceError',
      message: `AI service error: ${err.message}`,
      statusCode: 502,
    });
    return;
  }

  // Database errors
  if ((err as any).code && typeof (err as any).code === 'string' && (err as any).code.length === 5) {
    res.status(503).json({
      error: 'DatabaseError',
      message: 'Database operation failed. Please try again.',
      statusCode: 503,
    });
    return;
  }

  // Catch-all
  res.status(500).json({
    error: 'InternalError',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred.',
    statusCode: 500,
  });
}

/**
 * Wrapper for async route handlers.
 * Catches promise rejections and forwards them to the error middleware.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
