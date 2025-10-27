import { db } from '../db';
import { Category, NewCategory, CategoryUpdate } from '../types/database.types';

export const CategoryModel = {
  // Create a new category
  async create(data: NewCategory): Promise<Category> {
    return await db
      .insertInto('Category')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  // Find category by ID
  async findById(id: number): Promise<Category | undefined> {
    return await db
      .selectFrom('Category')
      .where('category_id', '=', id)
      .selectAll()
      .executeTakeFirst();
  },

  // Find all categories
  async findAll(): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  },

  // Update a category
  async update(id: number, updates: CategoryUpdate): Promise<Category | undefined> {
    return await db
      .updateTable('Category')
      .set(updates)
      .where('category_id', '=', id)
      .returningAll()
      .executeTakeFirst();
  },

  // Delete a category
  async delete(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('Category')
      .where('category_id', '=', id)
      .executeTakeFirst();

    return result.numDeletedRows > 0;
  },

  // Get categories for a mantra
  async getCategoriesForMantra(mantraId: number): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .innerJoin('MantraCategory', 'Category.category_id', 'MantraCategory.category_id')
      .where('MantraCategory.mantra_id', '=', mantraId)
      .selectAll('Category')
      .execute();
  },

  // Get mantras in a category
  async getMantrasInCategory(categoryId: number) {
    return await db
      .selectFrom('Mantra')
      .innerJoin('MantraCategory', 'Mantra.mantra_id', 'MantraCategory.mantra_id')
      .where('MantraCategory.category_id', '=', categoryId)
      .where('Mantra.is_active', '=', true)
      .selectAll('Mantra')
      .execute();
  },

  // Get category with mantra count
  async getCategoriesWithCount() {
    return await db
      .selectFrom('Category')
      .leftJoin('MantraCategory', 'Category.category_id', 'MantraCategory.category_id')
      .select([
        'Category.category_id',
        'Category.name',
        'Category.description',
        (eb) => eb.fn.count('MantraCategory.mantra_id').as('mantra_count'),
      ])
      .groupBy('Category.category_id')
      .orderBy('Category.name', 'asc')
      .execute();
  },
};
