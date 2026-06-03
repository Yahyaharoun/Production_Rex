import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { CreateUserInput } from './user.schema';

export class UserController {
  
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUserInput = req.body;
      const creatorRole = req.user?.role;
      const creatorAgenceId = req.user?.agenceId;

      const user = await UserService.createUser(data, creatorRole, creatorAgenceId);

      res.status(201).json({
        status: 'success',
        message: 'Utilisateur créé et mis en attente de validation',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, motif } = req.body;
      const validateurId = req.user!.id; // Garanti par le middleware auth

      const user = await UserService.validateAccount(id, validateurId, action, motif);

      res.status(200).json({
        status: 'success',
        message: `Le compte a été ${action === 'APPROUVER' ? 'approuvé' : 'rejeté'} avec succès.`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleDailyStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { statut } = req.body;
      const chefId = req.user!.id;
      const chefAgenceId = req.user!.agenceId;

      const user = await UserService.toggleDailyStatus(id, chefId, chefAgenceId, statut);

      res.status(200).json({
        status: 'success',
        message: `L'utilisateur est maintenant ${statut}.`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}
