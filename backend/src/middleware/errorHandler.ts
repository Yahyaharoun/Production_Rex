import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.name}: ${err.message}`, { 
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack 
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle Prisma errors (basic mapping)
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      status: 'error',
      message: 'Erreur de base de données (Conflit de données ou contrainte non respectée).',
      ...(env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Fallback for unexpected errors
  return res.status(500).json({
    status: 'error',
    message: 'Une erreur interne du serveur est survenue.',
    ...(env.NODE_ENV === 'development' && { stack: err.stack, details: err.message })
  });
};
