import { z } from 'zod';

// Create category schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(255),
    description: z.string().optional(),
  }),
});

// Update category schema
export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid category ID').transform(Number),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
  }),
});

// Get category by ID schema
export const getCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid category ID').transform(Number),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
