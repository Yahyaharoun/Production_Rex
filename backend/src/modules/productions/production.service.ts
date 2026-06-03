import { prisma } from '../../lib/prisma';
import { CreateProductionInput } from './production.schema';
import { AppError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { Role, StatutProduction } from '@prisma/client';

export class ProductionService {
  
  // Saisie de la production par la caissière
  static async create(data: CreateProductionInput, caissiereId: string, agenceId: string | null) {
    if (!agenceId) throw new ForbiddenError('Vous devez être assigné à une agence pour saisir une production.');

    const totalDepenses = data.carburant + data.peage + data.laverie + data.autresDepenses;
    const netAVerser = data.recettes - totalDepenses;

    const production = await prisma.productionJournaliere.create({
      data: {
        dateProduction: new Date(data.dateProduction),
        agenceId,
        caissiereId,
        statut: data.statut as StatutProduction,
        recettes: data.recettes,
        carburant: data.carburant,
        peage: data.peage,
        laverie: data.laverie,
        autresDepenses: data.autresDepenses,
        netAVerser: netAVerser
      }
    });

    // Logger l'action
    await prisma.auditLog.create({
      data: {
        userId: caissiereId,
        action: `Création de production: ${production.statut}`,
        entite: 'ProductionJournaliere',
        entiteId: production.id
      }
    });

    return production;
  }

  // Validation par le Chef
  static async valider(id: string, chefId: string, chefAgenceId: string | null, action: 'VALIDE' | 'REJETE', commentaireStr?: string) {
    const prod = await prisma.productionJournaliere.findUnique({ where: { id } });
    if (!prod) throw new NotFoundError('Production introuvable');

    if (prod.agenceId !== chefAgenceId) {
      throw new ForbiddenError('Vous ne pouvez valider que les productions de votre agence.');
    }

    if (prod.statut !== StatutProduction.SOUMIS) {
      throw new AppError('Seules les productions soumises peuvent être validées ou rejetées.', 400);
    }

    const nouveauStatut = action === 'VALIDE' ? StatutProduction.VALIDE : StatutProduction.REJETE;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.productionJournaliere.update({
        where: { id },
        data: { 
          statut: nouveauStatut,
          chefId: chefId
        }
      });

      if (commentaireStr) {
        await tx.commentaire.create({
          data: {
            productionId: id,
            userId: chefId,
            contenu: commentaireStr
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: chefId,
          action: `Production ${action}`,
          entite: 'ProductionJournaliere',
          entiteId: id
        }
      });

      return updated;
    });

    return result;
  }

  // Ajout de commentaire par l'Admin (ou autre)
  static async addComment(id: string, userId: string, contenu: string) {
    const prod = await prisma.productionJournaliere.findUnique({ where: { id } });
    if (!prod) throw new NotFoundError('Production introuvable');

    return await prisma.commentaire.create({
      data: {
        productionId: id,
        userId: userId,
        contenu: contenu
      },
      include: { user: { select: { nom: true, prenom: true, role: true } } }
    });
  }

  // Récupérer la liste (avec filtres de base)
  static async getAll(agenceId?: string | null, role?: Role) {
    const where: any = {};
    
    // Le chef et la caissière ne voient que leur agence
    if (role === Role.CHEF || role === Role.CAISSIERE) {
      if (!agenceId) return [];
      where.agenceId = agenceId;
    }

    return await prisma.productionJournaliere.findMany({
      where,
      orderBy: { dateProduction: 'desc' },
      include: {
        caissiere: { select: { nom: true, prenom: true } },
        chef: { select: { nom: true, prenom: true } },
        commentaires: {
          include: { user: { select: { nom: true, prenom: true, role: true } } }
        }
      }
    });
  }
}
