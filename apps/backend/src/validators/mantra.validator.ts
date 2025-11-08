import { z } from 'zod';

// Create mantra schema
export const createMantraSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    key_takeaway: z.string().min(1, 'Key takeaway is required'),
    background_author: z.string().optional(),
    background_description: z.string().optional(),
    jamie_take: z.string().optional(),
    when_where: z.string().optional(),
    negative_thoughts: z.string().optional(),
    cbt_principles: z.string().optional(),
    references: z.string().optional(),
    is_active: z.boolean().optional().default(true),
  }),
});

// Update mantra schema (all fields optional)
export const updateMantraSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    key_takeaway: z.string().min(1).optional(),
    background_author: z.string().optional(),
    background_description: z.string().optional(),
    jamie_take: z.string().optional(),
    when_where: z.string().optional(),
    negative_thoughts: z.string().optional(),
    cbt_principles: z.string().optional(),
    references: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});

// Search/filter query schema
export const mantraQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
    offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  }),
});

// Mantra ID param schema
export const mantraIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid mantra ID')),
  }),
});

// Category ID param schema
export const categoryIdSchema = z.object({
  params: z.object({
    categoryId: z.string().transform(Number).pipe(z.number().int().positive('Invalid category ID')),
  }),
});

export type CreateMantraInput = z.infer<typeof createMantraSchema>['body'];
export type UpdateMantraInput = z.infer<typeof updateMantraSchema>['body'];
export type MantraQueryInput = z.infer<typeof mantraQuerySchema>['query'];
