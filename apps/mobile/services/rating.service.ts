import { apiClient } from './api.config';

/**
 * TYPES
 */
export interface Rating {
  rating_id: number;
  user_id: number;
  mantra_id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface RatingResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    rating: Rating | null;
  };
}

export interface AverageRatingResponse {
  status: 'success' | 'error';
  data?: {
    average: number;
    count: number;
  };
}

export interface RateMutationResponse {
  status: 'success' | 'error';
  message?: string;
}

/**
 * RATING SERVICE
 */
export const ratingService = {
  async rateMantra(
    mantraId: number,
    rating: number,
    reviewText?: string,
    token?: string,
  ): Promise<RatingResponse> {
    const response = await apiClient.post<RatingResponse>(
      '/ratings',
      {
        mantra_id: mantraId,
        rating,
        review_text: reviewText,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Get user's rating for a mantra
   */
  async getUserRating(mantraId: number, token?: string): Promise<RatingResponse> {
    const response = await apiClient.get<RatingResponse>(`/ratings/mantra/${mantraId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Get average rating for a mantra
   */
  async getAverageRating(mantraId: number): Promise<AverageRatingResponse> {
    const response = await apiClient.get<AverageRatingResponse>(
      `/ratings/mantra/${mantraId}/average`,
    );
    return response.data;
  },

  /**
   * Delete a rating
   */
  async deleteRating(ratingId: number, token?: string): Promise<RateMutationResponse> {
    const response = await apiClient.delete<RateMutationResponse>(`/ratings/${ratingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
