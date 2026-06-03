import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError, UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { LoginInput } from './auth.schema';
import { StatutCompte } from '@prisma/client';

export class AuthService {
  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { agence: true }
    });

    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    // Vérification du statut du compte
    if (user.statut === StatutCompte.BLOQUE) {
      throw new ForbiddenError('Votre compte a été bloqué. Contactez l\'administrateur.');
    }
    
    if (user.statut === StatutCompte.EN_ATTENTE) {
      throw new ForbiddenError('Votre compte est en attente de validation par l\'administrateur.');
    }

    if (user.statut === StatutCompte.INACTIF) {
      throw new ForbiddenError('Votre compte est actuellement inactif. Attendez l\'activation de votre chef d\'agence.');
    }

    // Génération du token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        agence: user.agence
      }
    };
  }
}
