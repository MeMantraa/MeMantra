import { z } from 'zod';

// Create collection schema
export const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().optional(),
  }),
});

// Update collection schema
export const updateCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
  }),
});

// Collection ID param schema
export const collectionIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid collection ID')),
  }),
});

// Collection-Mantra association schema
export const collectionMantraSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid collection ID')),
    mantraId: z.string().transform(Number).pipe(z.number().int().positive('Invalid mantra ID')),
  }),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>['body'];
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>['body'];
