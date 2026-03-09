import { apiClient } from './api.config';
import Constants from 'expo-constants';

const USE_MOCK_DATA = Constants.expoConfig?.extra?.useMockData === true;

export interface RecommendedMantra {
  mantra: {
    mantra_id: number;
    title: string | null;
    key_takeaway: string | null;
    background_author: string | null;
    background_description: string | null;
    jamie_take: string | null;
    when_where: string | null;
    negative_thoughts: string | null;
    cbt_principles: string | null;
    references: string | null;
    created_at: string | null;
    is_active: boolean | null;
  };
  score: number;
  categories: Array<{ category_id: number; name: string }>;
  reason: string;
}

export interface SuggestionsResponse {
  status: string;
  message?: string;
  data: {
    recommendations: RecommendedMantra[];
    count: number;
  };
}

export interface GetSuggestionsParams {
  limit?: number;
  mood?: string;
  excludeIds?: number[];
}

/* istanbul ignore next */
const mockRecommendationService = {
  async getSuggestions(_params: GetSuggestionsParams = {}): Promise<SuggestionsResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      status: 'success',
      data: {
        recommendations: [
          {
            mantra: {
              mantra_id: 1,
              title: 'Pressure Is a Privilege',
              key_takeaway: 'Reframe pressure as proof of a meaningful opportunity.',
              background_author: 'Billie Jean King',
              background_description: null,
              jamie_take: null,
              when_where: null,
              negative_thoughts: null,
              cbt_principles: null,
              references: null,
              created_at: new Date().toISOString(),
              is_active: true,
            },
            score: 0.85,
            categories: [{ category_id: 1, name: 'Anxiety' }],
            reason: 'matches your preferred categories',
          },
        ],
        count: 1,
      },
    };
  },
};

const realRecommendationService = {
  async getSuggestions(params: GetSuggestionsParams = {}): Promise<SuggestionsResponse> {
    const queryParams = new URLSearchParams();

    if (params.limit) {
      queryParams.set('limit', String(params.limit));
    }
    if (params.mood) {
      queryParams.set('mood', params.mood);
    }
    if (params.excludeIds && params.excludeIds.length > 0) {
      queryParams.set('excludeIds', params.excludeIds.join(','));
    }

    const queryString = queryParams.toString();
    const url = `/recommendations/suggest${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<SuggestionsResponse>(url);
    return response.data;
  },
};

export const recommendationService = USE_MOCK_DATA
  ? mockRecommendationService
  : realRecommendationService;
