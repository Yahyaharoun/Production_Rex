import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '../../middleware/validate';
import { authenticate, restrictTo } from '../../middleware/auth';
import { createUserSchema, validateUserSchema, toggleUserStatusSchema } from './user.schema';
import { Role } from '@prisma/client';

const router = Router();

// Création d'un compte (Accessible aux Chefs et Admin)
router.post(
  '/',
  authenticate,
  restrictTo(Role.CHEF, Role.ADMIN),
  validate(createUserSchema),
  UserController.createUser
);

// Validation d'un compte (Uniquement Admin)
router.patch(
  '/:id/validation',
  authenticate,
  restrictTo(Role.ADMIN),
  validate(validateUserSchema),
  UserController.validateAccount
);

// Activer/Désactiver au quotidien (Uniquement Chef)
router.patch(
  '/:id/daily-status',
  authenticate,
  restrictTo(Role.CHEF),
  validate(toggleUserStatusSchema),
  UserController.toggleDailyStatus
);

export default router;
