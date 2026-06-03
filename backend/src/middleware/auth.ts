import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role, StatutCompte } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: Role;
}

// Étendre l'interface Request d'Express pour inclure le user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        statut: StatutCompte;
        agenceId: string | null;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder.');
    }

    // Vérification du token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Vérifier si l'utilisateur existe toujours
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!currentUser) {
      throw new UnauthorizedError('L\'utilisateur appartenant à ce token n\'existe plus.');
    }

    // Vérifier le statut du compte
    if (currentUser.statut === 'BLOQUE') {
      throw new ForbiddenError('Votre compte a été bloqué.');
    }
    
    if (currentUser.statut === 'INACTIF') {
      throw new ForbiddenError('Votre compte est actuellement inactif. Attendez l\'activation de votre chef d\'agence.');
    }
    
    if (currentUser.statut === 'EN_ATTENTE') {
      throw new ForbiddenError('Votre compte est en attente de validation par l\'administrateur.');
    }

    // Accès accordé, stocker les données de l'utilisateur dans req.user
    req.user = {
      id: currentUser.id,
      role: currentUser.role,
      statut: currentUser.statut,
      agenceId: currentUser.agenceId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token invalide. Veuillez vous reconnecter.'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Votre token a expiré. Veuillez vous reconnecter.'));
    } else {
      next(error);
    }
  }
};

export const restrictTo = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Vous n\'avez pas la permission d\'effectuer cette action.'));
    }
    next();
  };
};
