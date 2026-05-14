import { prisma } from '../../lib/prisma';
import { AppError, NotFoundError } from '../../utils/errors';
import { StatutTrajet } from '@prisma/client';

export class TrajetService {
  
  static async marquerDepart(id: string, chefId: string) {
    const trajet = await prisma.trajet.findUnique({ where: { id } });
    if (!trajet) throw new NotFoundError('Trajet introuvable');
    if (trajet.statut !== StatutTrajet.PROGRAMME) {
      throw new AppError('Ce trajet n\'est pas programmé ou est déjà parti.', 400);
    }

    const updated = await prisma.trajet.update({
      where: { id },
      data: {
        statut: StatutTrajet.EN_COURS,
        dateHeureDepart: new Date(), // Enregistrement temps réel
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: chefId,
        action: 'Départ de bus enregistré',
        entite: 'Trajet',
        entiteId: id
      }
    });

    return updated;
  }

  static async marquerArrivee(id: string, chefId: string) {
    const trajet = await prisma.trajet.findUnique({ where: { id }, include: { ligne: true } });
    if (!trajet) throw new NotFoundError('Trajet introuvable');
    if (trajet.statut !== StatutTrajet.EN_COURS) {
      throw new AppError('Ce trajet n\'est pas en cours.', 400);
    }

    const dateArrivee = new Date();
    
    // Logique simplifiée de détection de retard (Ex: si trajet dure plus que X heures - basé sur la ligne)
    // Ici, nous mettons 0 par défaut pour l'exemple. Dans un vrai système, on compare avec l'heure d'arrivée prévue.
    const retardMinutes = 0; 

    const updated = await prisma.trajet.update({
      where: { id },
      data: {
        statut: StatutTrajet.TERMINE,
        dateHeureArrivee: dateArrivee,
        retardMinutes
      }
    });

    // Libérer le véhicule et le chauffeur (Affectations)
    await prisma.vehicule.update({ where: { id: trajet.vehiculeId }, data: { enService: true }});
    await prisma.chauffeur.update({ where: { id: trajet.chauffeurId }, data: { enService: true }});

    return updated;
  }
}
