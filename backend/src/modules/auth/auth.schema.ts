import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
  })
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
