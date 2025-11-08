import { z } from 'zod';

// Mantra ID param schema for likes
export const likeMantraIdSchema = z.object({
  params: z.object({
    mantraId: z.string().transform(Number).pipe(z.number().int().positive('Invalid mantra ID')),
  }),
});

// Query schema for popular mantras
export const popularMantrasQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
  }),
});
