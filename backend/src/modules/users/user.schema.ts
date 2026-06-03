import { z } from 'zod';
import { Role, StatutCompte } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    nom: z.string().min(2, 'Le nom est requis'),
    prenom: z.string().min(2, 'Le prénom est requis'),
    telephone: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    agenceId: z.string().uuid().optional(),
  })
});

export const validateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID utilisateur invalide')
  }),
  body: z.object({
    action: z.enum(['APPROUVER', 'REJETER']),
    motif: z.string().optional()
  })
});

export const toggleUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID utilisateur invalide')
  }),
  body: z.object({
    statut: z.enum(['ACTIF', 'INACTIF'])
  })
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
