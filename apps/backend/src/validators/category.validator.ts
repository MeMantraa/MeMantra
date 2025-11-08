import { z } from 'zod';

// Category type enum from database schema
const categoryTypeEnum = z.enum(['emotion', 'cbt', 'context', 'reference']);

// Create category schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().optional(),
    category_type: categoryTypeEnum,
    image_url: z.string().url('Must be a valid URL').optional(),
  }),
});

// Update category schema
export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    category_type: categoryTypeEnum.optional(),
    image_url: z.string().url('Must be a valid URL').optional(),
  }),
});

// Category ID param schema
export const categoryIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid category ID')),
  }),
});

// Category type param schema
export const categoryTypeSchema = z.object({
  params: z.object({
    type: categoryTypeEnum,
  }),
});

// Mantra-Category association schema
export const mantraCategorySchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid category ID')),
    mantraId: z.string().transform(Number).pipe(z.number().int().positive('Invalid mantra ID')),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
