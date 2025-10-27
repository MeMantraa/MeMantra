import { z } from 'zod';

// Like/unlike mantra schema
export const likeMantraSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive('Invalid mantra ID'),
  }),
});

// Get mantra like status schema
export const getMantraLikeStatusSchema = z.object({
  params: z.object({
    mantraId: z.string().regex(/^\d+$/, 'Invalid mantra ID').transform(Number),
  }),
});

export type LikeMantraInput = z.infer<typeof likeMantraSchema>['body'];
