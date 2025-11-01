import { db } from '../db';
import { Category, NewCategory } from '../types/database.types';

export const CategoryModel = {
  // Create a new category
  async create(categoryData: NewCategory): Promise<Category> {
    const result = await db
      .insertInto('Category')
      .values(categoryData)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  // Find category by ID
  async findById(id: number): Promise<Category | undefined> {
    return await db
      .selectFrom('Category')
      .where('category_id', '=', id)
      .selectAll()
      .executeTakeFirst();
  },

  // Get all categories
  async findAll(): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  },

  // Find category by name
  async findByName(name: string): Promise<Category | undefined> {
    return await db
      .selectFrom('Category')
      .where('name', '=', name)
      .selectAll()
      .executeTakeFirst();
  },

  // Link a mantra to a category (many-to-many relationship)
  async addMantraToCategory(mantraId: number, categoryId: number): Promise<void> {
    await db
      .insertInto('MantraCategory')
      .values({
        mantra_id: mantraId,
        category_id: categoryId,
      })
      .execute();
  },

  // Remove mantra from category
  async removeMantraFromCategory(mantraId: number, categoryId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('MantraCategory')
      .where('mantra_id', '=', mantraId)
      .where('category_id', '=', categoryId)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Get all mantras in a category (with join)
  async getMantrasInCategory(categoryId: number) {
    const mantras = await db
      .selectFrom('Mantra')
      .innerJoin('MantraCategory', 'Mantra.mantra_id', 'MantraCategory.mantra_id')
      .where('MantraCategory.category_id', '=', categoryId)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .execute();

    return mantras;
  },

  // Get all categories for a specific mantra
  async getCategoriesForMantra(mantraId: number) {
    const categories = await db
      .selectFrom('Category')
      .innerJoin('MantraCategory', 'Category.category_id', 'MantraCategory.category_id')
      .where('MantraCategory.mantra_id', '=', mantraId)
      .selectAll('Category')
      .execute();

    return categories;
  },
};

