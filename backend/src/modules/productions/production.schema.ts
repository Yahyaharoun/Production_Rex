import { z } from 'zod';
import { StatutProduction } from '@prisma/client';

export const createProductionSchema = z.object({
  body: z.object({
    dateProduction: z.string().datetime(),
    recettes: z.number().min(0),
    carburant: z.number().min(0),
    peage: z.number().min(0),
    laverie: z.number().min(0),
    autresDepenses: z.number().min(0),
    statut: z.enum(['BROUILLON', 'SOUMIS']).default('BROUILLON')
  })
});

export const validateProductionSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    action: z.enum(['VALIDE', 'REJETE']),
    commentaire: z.string().optional()
  })
});

export const addCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    contenu: z.string().min(1)
  })
});

export type CreateProductionInput = z.infer<typeof createProductionSchema>['body'];
