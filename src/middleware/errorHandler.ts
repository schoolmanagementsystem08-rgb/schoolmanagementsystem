import { Request, Response, NextFunction } from 'express';
import { logError } from '../lib/activity-logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const level = statusCode < 500 ? 'warning' : 'error';

  logError({
    message: err.message,
    level,
    stack: err.stack,
    context: { statusCode, url: req.originalUrl, method: req.method, body: req.body },
    req,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  logError({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    level: 'warning',
    context: { url: req.originalUrl, method: req.method },
    req,
  });
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};
