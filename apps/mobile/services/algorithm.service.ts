import { apiClient } from './api.config';

export interface CategoryScore {
  category_id: number;
  name: string;
  category_type: string | null;
  score: number;
}

export interface AlgorithmScoresResponse {
  status: string;
  data: { scores: CategoryScore[] };
}

export interface TopCategoriesResponse {
  status: string;
  data: { categories: CategoryScore[] };
}

export const algorithmService = {
  /** GET /api/algorithm/scores — all category scores for the current user */
  async getScores(token: string): Promise<AlgorithmScoresResponse> {
    const response = await apiClient.get('/algorithm/scores', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /** GET /api/algorithm/top?limit=N — top N categories */
  async getTopCategories(token: string, limit = 10): Promise<TopCategoriesResponse> {
    const response = await apiClient.get('/algorithm/top', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit },
    });
    return response.data;
  },

  /** PUT /api/algorithm/scores/:categoryId — manually set a category score */
  async updateScore(token: string, categoryId: number, score: number) {
    const response = await apiClient.put(
      `/algorithm/scores/${categoryId}`,
      { score },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },

  /** DELETE /api/algorithm/scores/:categoryId — reset a single category */
  async resetScore(token: string, categoryId: number) {
    const response = await apiClient.delete(`/algorithm/scores/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /** DELETE /api/algorithm/scores — reset entire algorithm */
  async resetAllScores(token: string) {
    const response = await apiClient.delete('/algorithm/scores', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
