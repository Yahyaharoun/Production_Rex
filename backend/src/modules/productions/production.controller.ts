import { Request, Response, NextFunction } from 'express';
import { ProductionService } from './production.service';

export class ProductionController {
  
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const caissiereId = req.user!.id;
      const agenceId = req.user!.agenceId;
      
      const production = await ProductionService.create(req.body, caissiereId, agenceId);
      
      res.status(201).json({
        status: 'success',
        data: production
      });
    } catch (error) {
      next(error);
    }
  }

  static async valider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, commentaire } = req.body;
      const chefId = req.user!.id;
      const chefAgenceId = req.user!.agenceId;

      const production = await ProductionService.valider(id, chefId, chefAgenceId, action, commentaire);

      res.status(200).json({
        status: 'success',
        data: production
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { contenu } = req.body;
      const userId = req.user!.id;

      const comment = await ProductionService.addComment(id, userId, contenu);

      res.status(201).json({
        status: 'success',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.user!.role;
      const agenceId = req.user!.agenceId;

      const productions = await ProductionService.getAll(agenceId, role);

      res.status(200).json({
        status: 'success',
        results: productions.length,
        data: productions
      });
    } catch (error) {
      next(error);
    }
  }
}
