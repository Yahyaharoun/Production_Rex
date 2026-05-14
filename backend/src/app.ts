import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';

export const app: Application = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes HTTP
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Route de base (Healthcheck)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'API Transport ERP fonctionnelle' });
});

import userRoutes from './modules/users/user.routes';
import authRoutes from './modules/auth/auth.routes';
import productionRoutes from './modules/productions/production.routes';

// Routes API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/productions', productionRoutes);

// Gestion de la route 404
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`L'URL ${req.originalUrl} est introuvable sur ce serveur.`));
});

// Middleware global de gestion des erreurs (doit être le dernier)
app.use(errorHandler);
