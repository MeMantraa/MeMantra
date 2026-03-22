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
    return await db.selectFrom('Category').selectAll().orderBy('name', 'asc').execute();
  },

  // Get all active categories only
  async findAllActive(): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .where('is_active', '=', true)
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  },

  // Find categories by type
  async findByType(categoryType: string): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .where('category_type', '=', categoryType)
      .where('is_active', '=', true)
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  },

  // Find category by name
  async findByName(name: string): Promise<Category | undefined> {
    return await db.selectFrom('Category').where('name', '=', name).selectAll().executeTakeFirst();
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

  // Get categories for multiple mantras in a single query (avoids N+1)
  async getCategoriesForMantras(
    mantraIds: number[],
  ): Promise<Array<{ mantra_id: number; category_id: number; name: string }>> {
    if (mantraIds.length === 0) return [];

    return await db
      .selectFrom('MantraCategory')
      .innerJoin('Category', 'Category.category_id', 'MantraCategory.category_id')
      .where('MantraCategory.mantra_id', 'in', mantraIds)
      .select(['MantraCategory.mantra_id', 'Category.category_id', 'Category.name'])
      .execute();
  },

  // Update category details
  async update(
    categoryId: number,
    updates: Partial<
      Pick<
        Category,
        'name' | 'description' | 'category_type' | 'parent_id' | 'image_url' | 'is_active'
      >
    >,
  ): Promise<Category | undefined> {
    return await db
      .updateTable('Category')
      .set(updates)
      .where('category_id', '=', categoryId)
      .returningAll()
      .executeTakeFirst();
  },

  // Soft delete a category (set is_active to false)
  async softDelete(categoryId: number): Promise<Category | undefined> {
    return await db
      .updateTable('Category')
      .set({ is_active: false })
      .where('category_id', '=', categoryId)
      .returningAll()
      .executeTakeFirst();
  },

  // Reactivate a category (set is_active to true)
  async reactivate(categoryId: number): Promise<Category | undefined> {
    return await db
      .updateTable('Category')
      .set({ is_active: true })
      .where('category_id', '=', categoryId)
      .returningAll()
      .executeTakeFirst();
  },

  // Get child categories (subcategories) of a parent category
  async getChildren(parentId: number): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .where('parent_id', '=', parentId)
      .where('is_active', '=', true)
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  },

  // Get top-level categories (no parent)
  async findTopLevel(): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .where('parent_id', 'is', null)
      .where('is_active', '=', true)
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  },

  // Get top-level categories by type (no parent)
  async findTopLevelByType(categoryType: string): Promise<Category[]> {
    return await db
      .selectFrom('Category')
      .where('category_type', '=', categoryType)
      .where('parent_id', 'is', null)
      .where('is_active', '=', true)
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  },
};
