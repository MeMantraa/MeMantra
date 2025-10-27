import { z } from 'zod';

// Create collection schema
export const createCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Collection name is required').max(255),
    description: z.string().optional(),
  }),
});

// Update collection schema
export const updateCollectionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid collection ID').transform(Number),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
  }),
});

// Get collection by ID schema
export const getCollectionByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid collection ID').transform(Number),
  }),
});

// Add mantra to collection schema
export const addMantraToCollectionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid collection ID').transform(Number),
  }),
  body: z.object({
    mantra_id: z.number().int().positive('Invalid mantra ID'),
  }),
});

// Remove mantra from collection schema
export const removeMantraFromCollectionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid collection ID').transform(Number),
    mantraId: z.string().regex(/^\d+$/, 'Invalid mantra ID').transform(Number),
  }),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>['body'];
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>['body'];
export type AddMantraToCollectionInput = z.infer<typeof addMantraToCollectionSchema>['body'];
