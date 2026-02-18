// ---- Mock Setup ----
jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { algorithmService } from '../../services/algorithm.service';
import { apiClient } from '../../services/api.config';

const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

describe('algorithmService', () => {
  const token = 'test-jwt-token';
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getScores', () => {
    it('should fetch all category scores', async () => {
      const mockScores = {
        data: {
          status: 'success',
          data: {
            scores: [
              { category_id: 1, name: 'Anxiety', category_type: 'essential', score: 5 },
              { category_id: 2, name: 'Focus', category_type: 'goal', score: 3 },
            ],
          },
        },
      };
      mockGet.mockResolvedValueOnce(mockScores);

      const result = await algorithmService.getScores(token);

      expect(mockGet).toHaveBeenCalledWith('/algorithm/scores', authHeader);
      expect(result).toEqual(mockScores.data);
      expect(result.data.scores).toHaveLength(2);
    });

    it('should propagate errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(algorithmService.getScores(token)).rejects.toThrow('Unauthorized');
    });
  });

  describe('getTopCategories', () => {
    it('should fetch top categories with default limit', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            categories: [
              { category_id: 1, name: 'Anxiety', category_type: 'essential', score: 10 },
            ],
          },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await algorithmService.getTopCategories(token);

      expect(mockGet).toHaveBeenCalledWith('/algorithm/top', {
        ...authHeader,
        params: { limit: 10 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch top categories with custom limit', async () => {
      const mockResponse = {
        data: { status: 'success', data: { categories: [] } },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      await algorithmService.getTopCategories(token, 5);

      expect(mockGet).toHaveBeenCalledWith('/algorithm/top', {
        ...authHeader,
        params: { limit: 5 },
      });
    });

    it('should propagate errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Server Error'));

      await expect(algorithmService.getTopCategories(token)).rejects.toThrow('Server Error');
    });
  });

  describe('updateScore', () => {
    it('should update a category score', async () => {
      const mockResponse = {
        data: { status: 'success', message: 'Score updated' },
      };
      mockPut.mockResolvedValueOnce(mockResponse);

      const result = await algorithmService.updateScore(token, 42, 8);

      expect(mockPut).toHaveBeenCalledWith('/algorithm/scores/42', { score: 8 }, authHeader);
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors', async () => {
      mockPut.mockRejectedValueOnce(new Error('Not Found'));

      await expect(algorithmService.updateScore(token, 999, 5)).rejects.toThrow('Not Found');
    });
  });

  describe('resetScore', () => {
    it('should reset a single category score', async () => {
      const mockResponse = {
        data: { status: 'success', message: 'Score reset' },
      };
      mockDelete.mockResolvedValueOnce(mockResponse);

      const result = await algorithmService.resetScore(token, 42);

      expect(mockDelete).toHaveBeenCalledWith('/algorithm/scores/42', authHeader);
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(algorithmService.resetScore(token, 42)).rejects.toThrow('Forbidden');
    });
  });

  describe('resetAllScores', () => {
    it('should reset all category scores', async () => {
      const mockResponse = {
        data: { status: 'success', message: 'All scores reset' },
      };
      mockDelete.mockResolvedValueOnce(mockResponse);

      const result = await algorithmService.resetAllScores(token);

      expect(mockDelete).toHaveBeenCalledWith('/algorithm/scores', authHeader);
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Server Error'));

      await expect(algorithmService.resetAllScores(token)).rejects.toThrow('Server Error');
    });
  });
});
