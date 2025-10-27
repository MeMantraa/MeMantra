import { z } from 'zod';

// Create mantra schema (admin only)
export const createMantraSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    key_takeaway: z.string().optional(),
    background_author: z.string().optional(),
    background_description: z.string().optional(),
    jamie_take: z.string().optional(),
    when_where: z.string().optional(),
    negative_thoughts: z.string().optional(),
    cbt_principles: z.string().optional(),
    references: z.string().optional(),
    is_active: z.boolean().default(true),
    category_ids: z.array(z.number()).optional(), // For adding to categories
  }),
});

// Update mantra schema
export const updateMantraSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid mantra ID').transform(Number),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    key_takeaway: z.string().optional(),
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

// Get mantra by ID schema
export const getMantraByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid mantra ID').transform(Number),
  }),
});

// List mantras schema with pagination and filtering
export const listMantrasSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).default(20),
    category_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
  }),
});

// Search mantras schema
export const searchMantrasSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.string().regex(/^\d+$/).transform(Number).default(20),
  }),
});

// Add mantra to category schema
export const addMantraToCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid mantra ID').transform(Number),
  }),
  body: z.object({
    category_id: z.number().int().positive(),
  }),
});

export type CreateMantraInput = z.infer<typeof createMantraSchema>['body'];
export type UpdateMantraInput = z.infer<typeof updateMantraSchema>['body'];
export type ListMantrasQuery = z.infer<typeof listMantrasSchema>['query'];
export type SearchMantrasQuery = z.infer<typeof searchMantrasSchema>['query'];
