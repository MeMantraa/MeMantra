import { apiClient } from './api.config';

const USE_MOCK_DATA = false;

/**
 * TYPES
 */
export interface Category {
  category_id: number;
  name: string;
  description?: string;
  category_type?: 'essential' | 'goal' | 'mood' | 'scenario' | 'time' | 'theme';
  parent_id?: number | null;
  image_url?: string;
  is_active: boolean;
}

export interface CategoryResponse {
  status: string;
  message?: string;
  data: { categories: Category[] };
}

export interface SingleCategoryResponse {
  status: string;
  message?: string;
  data: { category: Category };
}

export interface CategoryMutationResponse {
  status: string;
  message?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  category_type?: 'essential' | 'goal' | 'mood' | 'scenario' | 'time' | 'theme';
  parent_id?: number;
  image_url?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  category_type?: 'essential' | 'goal' | 'mood' | 'scenario' | 'time' | 'theme';
  parent_id?: number | null;
  image_url?: string;
}

/**
 * MOCK DATA
 */
let mockCategories: Category[] = [
  // ── Essentials (top-level) ──
  {
    category_id: 1,
    name: 'Mind & Emotional Health',
    description: 'Mantras for mental well-being and emotional resilience',
    category_type: 'essential',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 2,
    name: 'Physical Health & Energy',
    description: 'Mantras for physical vitality and healthy living',
    category_type: 'essential',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 3,
    name: 'Work & Learning',
    description: 'Mantras for career growth, productivity, and education',
    category_type: 'essential',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 4,
    name: 'Relationships & Social Life',
    description: 'Mantras for building and maintaining connections',
    category_type: 'essential',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 5,
    name: 'Personal Growth & Goals',
    description: 'Mantras for self-improvement and ambition',
    category_type: 'essential',
    parent_id: null,
    is_active: true,
  },
  // ── Essential subcategories ──
  {
    category_id: 6,
    name: 'Stress Relief / Calm',
    description: 'Mantras to reduce stress and find calm',
    category_type: 'essential',
    parent_id: 1,
    is_active: true,
  },
  {
    category_id: 7,
    name: 'Mindfulness / Presence',
    description: 'Mantras for staying present and mindful',
    category_type: 'essential',
    parent_id: 1,
    is_active: true,
  },
  {
    category_id: 8,
    name: 'Emotional Balance / Letting Go',
    description: 'Mantras for emotional equilibrium and releasing negativity',
    category_type: 'essential',
    parent_id: 1,
    is_active: true,
  },
  // ── Goals ──
  {
    category_id: 20,
    name: 'Boost Confidence & Courage',
    description: 'Mantras to build confidence and courage',
    category_type: 'goal',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 21,
    name: 'Stay Motivated & Focused',
    description: 'Mantras for maintaining motivation and focus',
    category_type: 'goal',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 22,
    name: 'Build Resilience & Adaptability',
    description: 'Mantras for resilience and adapting to change',
    category_type: 'goal',
    parent_id: null,
    is_active: true,
  },
  // ── Moods ──
  {
    category_id: 30,
    name: 'Calm / Relaxed',
    description: 'When you feel calm and want to maintain serenity',
    category_type: 'mood',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 31,
    name: 'Stressed / Overwhelmed',
    description: 'When you feel overwhelmed or under pressure',
    category_type: 'mood',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 32,
    name: 'Reflective / Thoughtful',
    description: 'When you are in a contemplative or introspective mood',
    category_type: 'mood',
    parent_id: null,
    is_active: true,
  },
  // ── Scenarios ──
  {
    category_id: 40,
    name: 'Work Challenges & Deadlines',
    description: 'Mantras for navigating work pressure and deadlines',
    category_type: 'scenario',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 41,
    name: 'Tough Decisions / Dilemmas',
    description: 'Mantras for making difficult decisions',
    category_type: 'scenario',
    parent_id: null,
    is_active: true,
  },
  // ── Times ──
  {
    category_id: 50,
    name: 'Morning Motivation',
    description: 'Mantras to start the day with energy and positivity',
    category_type: 'time',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 51,
    name: 'Midday Focus / Energy Boost',
    description: 'Mantras for a midday reset and renewed focus',
    category_type: 'time',
    parent_id: null,
    is_active: true,
  },
  // ── Themes ──
  {
    category_id: 60,
    name: 'Courage & Confidence',
    description: 'Mantras for bravery and self-assurance',
    category_type: 'theme',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 61,
    name: 'Mindfulness & Presence',
    description: 'Mantras for staying present and aware',
    category_type: 'theme',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 62,
    name: 'Positivity & Joy',
    description: 'Mantras for positive thinking and joyful living',
    category_type: 'theme',
    parent_id: null,
    is_active: true,
  },
];

const mockMantraCategories: Map<number, Set<number>> = new Map();

/* istanbul ignore next */
const mockCategoryService = {
  async getAllCategories(_token: string): Promise<CategoryResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      status: 'success',
      data: { categories: mockCategories.filter((c) => c.is_active) },
    };
  },

  async getCategoryById(id: number, _token: string): Promise<SingleCategoryResponse> {
    const category = mockCategories.find((c) => c.category_id === id);
    if (!category) {
      return {
        status: 'error',
        message: 'Category not found',
        data: { category: null as unknown as Category },
      };
    }
    return { status: 'success', data: { category } };
  },

  async createCategory(
    data: CreateCategoryPayload,
    _token: string,
  ): Promise<SingleCategoryResponse> {
    const nextId =
      mockCategories.length > 0 ? Math.max(...mockCategories.map((c) => c.category_id)) + 1 : 1;
    const newCategory: Category = {
      category_id: nextId,
      name: data.name,
      description: data.description,
      category_type: data.category_type,
      image_url: data.image_url,
      is_active: true,
    };
    mockCategories = [newCategory, ...mockCategories];
    return { status: 'success', data: { category: newCategory } };
  },

  async updateCategory(
    id: number,
    data: UpdateCategoryPayload,
    _token: string,
  ): Promise<SingleCategoryResponse> {
    const index = mockCategories.findIndex((c) => c.category_id === id);
    if (index === -1) {
      return {
        status: 'error',
        message: 'Category not found',
        data: { category: null as unknown as Category },
      };
    }
    mockCategories[index] = { ...mockCategories[index], ...data };
    return { status: 'success', data: { category: mockCategories[index] } };
  },

  async deleteCategory(id: number, _token: string): Promise<CategoryMutationResponse> {
    mockCategories = mockCategories.filter((c) => c.category_id !== id);
    return { status: 'success', message: 'Category deleted' };
  },

  async getCategoriesForMantra(mantraId: number, _token: string): Promise<CategoryResponse> {
    const categoryIds = mockMantraCategories.get(mantraId) || new Set();
    const categories = mockCategories.filter((c) => categoryIds.has(c.category_id));
    return { status: 'success', data: { categories } };
  },

  async addMantraToCategory(
    categoryId: number,
    mantraId: number,
    _token: string,
  ): Promise<CategoryMutationResponse> {
    if (!mockMantraCategories.has(mantraId)) {
      mockMantraCategories.set(mantraId, new Set());
    }
    mockMantraCategories.get(mantraId)!.add(categoryId);
    return { status: 'success', message: 'Mantra added to category' };
  },

  async removeMantraFromCategory(
    categoryId: number,
    mantraId: number,
    _token: string,
  ): Promise<CategoryMutationResponse> {
    mockMantraCategories.get(mantraId)?.delete(categoryId);
    return { status: 'success', message: 'Mantra removed from category' };
  },
};

/**
 * REAL API SERVICE
 */
const realCategoryService = {
  async getAllCategories(_token: string): Promise<CategoryResponse> {
    const response = await apiClient.get<CategoryResponse>('/categories');
    return response.data;
  },

  async getCategoryById(id: number, _token: string): Promise<SingleCategoryResponse> {
    const response = await apiClient.get<SingleCategoryResponse>(`/categories/${id}`);
    return response.data;
  },

  async createCategory(
    data: CreateCategoryPayload,
    _token: string,
  ): Promise<SingleCategoryResponse> {
    const response = await apiClient.post<SingleCategoryResponse>('/categories', data);
    return response.data;
  },

  async updateCategory(
    id: number,
    data: UpdateCategoryPayload,
    _token: string,
  ): Promise<SingleCategoryResponse> {
    const response = await apiClient.put<SingleCategoryResponse>(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number, _token: string): Promise<CategoryMutationResponse> {
    const response = await apiClient.delete<CategoryMutationResponse>(`/categories/${id}`);
    return response.data;
  },

  async getCategoriesForMantra(mantraId: number, _token: string): Promise<CategoryResponse> {
    const response = await apiClient.get<CategoryResponse>(`/mantras/${mantraId}/categories`);
    return response.data;
  },

  async addMantraToCategory(
    categoryId: number,
    mantraId: number,
    _token: string,
  ): Promise<CategoryMutationResponse> {
    const response = await apiClient.post<CategoryMutationResponse>(
      `/categories/${categoryId}/mantras/${mantraId}`,
    );
    return response.data;
  },

  async removeMantraFromCategory(
    categoryId: number,
    mantraId: number,
    _token: string,
  ): Promise<CategoryMutationResponse> {
    const response = await apiClient.delete<CategoryMutationResponse>(
      `/categories/${categoryId}/mantras/${mantraId}`,
    );
    return response.data;
  },
};

/**
 * EXPORT
 */
export const categoryService = USE_MOCK_DATA ? mockCategoryService : realCategoryService;
