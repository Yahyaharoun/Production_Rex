import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { AppError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreateUserInput } from './user.schema';
import { Role, StatutCompte } from '@prisma/client';

export class UserService {
  
  // Création d'un utilisateur (Ex: Le Chef crée une caissière)
  static async createUser(data: CreateUserInput, creatorRole?: Role, creatorAgenceId?: string | null) {
    // Règle métier : Un chef ne peut créer que pour son agence
    if (creatorRole === Role.CHEF && data.agenceId !== creatorAgenceId) {
      throw new ForbiddenError('Un chef ne peut créer un utilisateur que pour sa propre agence.');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        role: data.role || Role.CAISSIERE,
        agenceId: data.agenceId,
        statut: StatutCompte.EN_ATTENTE, // Toujours en attente par défaut pour la validation admin
      },
      select: { id: true, email: true, nom: true, prenom: true, role: true, statut: true, agenceId: true }
    });

    return user;
  }

  // Validation d'un compte par l'Admin
  static async validateAccount(userId: string, validateurId: string, action: 'APPROUVER' | 'REJETER', motif?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Utilisateur introuvable');
    if (user.statut !== StatutCompte.EN_ATTENTE) {
      throw new AppError('Ce compte a déjà été traité', 400);
    }

    const nouveauStatut = action === 'APPROUVER' ? StatutCompte.ACTIF : StatutCompte.BLOQUE;

    // Transaction pour mettre à jour l'utilisateur ET créer l'historique de validation
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { statut: nouveauStatut },
        select: { id: true, email: true, statut: true }
      });

      await tx.validationCompte.create({
        data: {
          userId,
          validateurId,
          statutAvant: StatutCompte.EN_ATTENTE,
          statutApres: nouveauStatut,
          motif
        }
      });

      return u;
    });

    return updatedUser;
  }

  // Activer/Désactiver au début et fin de journée par le Chef
  static async toggleDailyStatus(userId: string, chefId: string, chefAgenceId: string | null, nouveauStatut: 'ACTIF' | 'INACTIF') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Utilisateur introuvable');
    
    // Un chef ne peut modifier que les employés de son agence
    if (user.agenceId !== chefAgenceId) {
      throw new ForbiddenError('Vous ne pouvez modifier que les employés de votre agence.');
    }

    // On ne peut activer/désactiver que si le compte n'est ni bloqué ni en attente
    if (user.statut === StatutCompte.BLOQUE || user.statut === StatutCompte.EN_ATTENTE) {
      throw new AppError(`Impossible de modifier le statut quotidien d'un compte ${user.statut}`, 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { statut: nouveauStatut },
      select: { id: true, nom: true, statut: true }
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        userId: chefId,
        action: `Passage de l'utilisateur ${userId} au statut ${nouveauStatut}`,
        entite: 'User',
        entiteId: userId
      }
    });

    return updatedUser;
  }
}
