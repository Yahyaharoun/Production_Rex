import { Router } from 'express';
import { ProductionController } from './production.controller';
import { validate } from '../../middleware/validate';
import { authenticate, restrictTo } from '../../middleware/auth';
import { createProductionSchema, validateProductionSchema, addCommentSchema } from './production.schema';
import { Role } from '@prisma/client';

const router = Router();

// Toutes les routes sont protégées
router.use(authenticate);

// Lister les productions (filtrées par agence pour Chef/Caissière)
router.get('/', ProductionController.getAll);

// Saisie par la caissière
router.post(
  '/',
  restrictTo(Role.CAISSIERE),
  validate(createProductionSchema),
  ProductionController.create
);

// Validation par le Chef
router.patch(
  '/:id/validation',
  restrictTo(Role.CHEF),
  validate(validateProductionSchema),
  ProductionController.valider
);

// Commentaire par l'Admin (ou Chef)
router.post(
  '/:id/commentaires',
  restrictTo(Role.ADMIN, Role.CHEF),
  validate(addCommentSchema),
  ProductionController.addComment
);

export default router;
