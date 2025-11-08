import { z } from 'zod';

// Create recommendation schema
export const createRecommendationSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive('Mantra ID must be a positive integer'),
    reason: z.string().min(1, 'Reason is required'),
  }),
});

// Recommendation ID param schema
export const recommendationIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid recommendation ID')),
  }),
});

// Query schema for pagination
export const recommendationQuerySchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
    offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  }),
});

// Query schema for recent recommendations
export const recentQuerySchema = z.object({
  query: z.object({
    days: z.string().transform(Number).pipe(z.number().min(1).max(365)).optional(),
  }),
});

export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>['body'];
