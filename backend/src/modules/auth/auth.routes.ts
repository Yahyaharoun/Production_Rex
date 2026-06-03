import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema } from './auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);

export default router;
