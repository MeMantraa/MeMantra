// ---- Mock Setup ----
jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { useMockData: false },
    },
  },
}));

import { recommendationService, GetSuggestionsParams } from '../../services/recommendation.service';
import { apiClient } from '../../services/api.config';

const mockGet = apiClient.get as jest.Mock;

describe('recommendationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSuggestions', () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: {
          recommendations: [
            {
              mantra: {
                mantra_id: 1,
                title: 'Test Mantra',
                key_takeaway: 'Key takeaway',
                background_author: null,
                background_description: null,
                jamie_take: null,
                when_where: null,
                negative_thoughts: null,
                cbt_principles: null,
                references: null,
                created_at: '2025-01-01T00:00:00.000Z',
                is_active: true,
              },
              score: 0.9,
              categories: [{ category_id: 1, name: 'Anxiety' }],
              reason: 'matches your preferences',
            },
          ],
          count: 1,
        },
      },
    };

    it('should fetch suggestions with no params', async () => {
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await recommendationService.getSuggestions();

      expect(mockGet).toHaveBeenCalledWith('/recommendations/suggest');
      expect(result).toEqual(mockResponse.data);
    });

    it('should include limit param in URL', async () => {
      mockGet.mockResolvedValueOnce(mockResponse);

      await recommendationService.getSuggestions({ limit: 5 });

      expect(mockGet).toHaveBeenCalledWith('/recommendations/suggest?limit=5');
    });

    it('should include mood param in URL', async () => {
      mockGet.mockResolvedValueOnce(mockResponse);

      await recommendationService.getSuggestions({ mood: 'happy' });

      expect(mockGet).toHaveBeenCalledWith('/recommendations/suggest?mood=happy');
    });

    it('should include excludeIds param in URL', async () => {
      mockGet.mockResolvedValueOnce(mockResponse);

      await recommendationService.getSuggestions({ excludeIds: [1, 2, 3] });

      expect(mockGet).toHaveBeenCalledWith('/recommendations/suggest?excludeIds=1%2C2%2C3');
    });

    it('should include all params in URL', async () => {
      mockGet.mockResolvedValueOnce(mockResponse);

      const params: GetSuggestionsParams = {
        limit: 10,
        mood: 'calm',
        excludeIds: [5, 6],
      };
      await recommendationService.getSuggestions(params);

      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('limit=10');
      expect(url).toContain('mood=calm');
      expect(url).toContain('excludeIds=5%2C6');
    });

    it('should skip empty excludeIds array', async () => {
      mockGet.mockResolvedValueOnce(mockResponse);

      await recommendationService.getSuggestions({ excludeIds: [] });

      expect(mockGet).toHaveBeenCalledWith('/recommendations/suggest');
    });

    it('should propagate API errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));

      await expect(recommendationService.getSuggestions()).rejects.toThrow('Network Error');
    });

    it('should return response data with correct structure', async () => {
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await recommendationService.getSuggestions();

      expect(result.status).toBe('success');
      expect(result.data.recommendations).toHaveLength(1);
      expect(result.data.count).toBe(1);
      expect(result.data.recommendations[0].score).toBe(0.9);
      expect(result.data.recommendations[0].mantra.mantra_id).toBe(1);
      expect(result.data.recommendations[0].categories[0].name).toBe('Anxiety');
    });
  });
});
