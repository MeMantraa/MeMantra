// ---- Mock Setup ----
interface Rating {
  rating_id: number;
  user_id: number;
  mantra_id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}

let mockState: {
  ratings: Rating[];
  nextRatingId: number;
};

function resetState() {
  mockState = {
    ratings: [],
    nextRatingId: 1,
  };
}

// Mock for apiClient
jest.mock('../../services/api.config', () => ({
  apiClient: {
    post: jest.fn((url: string, body: any, config?: any) => {
      if (url === '/ratings') {
        const newRating: Rating = {
          rating_id: mockState.nextRatingId++,
          user_id: 3,
          mantra_id: body.mantra_id,
          rating: body.rating,
          review_text: body.review_text || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockState.ratings.push(newRating);
        return Promise.resolve({
          data: {
            status: 'success',
            message: 'Rating created successfully',
            data: { rating: newRating },
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),

    get: jest.fn((url: string) => {
      const userRatingMatch = url.match(/^\/ratings\/mantra\/(\d+)$/);
      if (userRatingMatch) {
        const mantraId = Number(userRatingMatch[1]);
        const rating = mockState.ratings.find((r) => r.mantra_id === mantraId);
        return Promise.resolve({
          data: {
            status: 'success',
            data: { rating: rating || null },
          },
        });
      }

      // Get average rating: /ratings/mantra/:mantraId/average
      const avgRatingMatch = url.match(/^\/ratings\/mantra\/(\d+)\/average$/);
      if (avgRatingMatch) {
        const mantraId = Number(avgRatingMatch[1]);
        const mantraRatings = mockState.ratings.filter((r) => r.mantra_id === mantraId);
        const average =
          mantraRatings.length > 0
            ? mantraRatings.reduce((sum, r) => sum + r.rating, 0) / mantraRatings.length
            : 0;
        return Promise.resolve({
          data: {
            status: 'success',
            data: {
              average: Number(average.toFixed(1)),
              count: mantraRatings.length,
            },
          },
        });
      }

      return Promise.resolve({ data: {} });
    }),

    delete: jest.fn((url: string) => {
      const match = url.match(/^\/ratings\/(\d+)$/);
      if (match) {
        const ratingId = Number(match[1]);
        const index = mockState.ratings.findIndex((r) => r.rating_id === ratingId);
        if (index !== -1) {
          mockState.ratings.splice(index, 1);
          return Promise.resolve({
            data: {
              status: 'success',
              message: 'Rating deleted successfully',
            },
          });
        } else {
          return Promise.resolve({
            data: {
              status: 'error',
              message: 'Rating not found',
            },
          });
        }
      }
      return Promise.resolve({ data: {} });
    }),
  },
}));

import { ratingService } from '../../services/rating.service';

describe('ratingService', () => {
  beforeEach(() => {
    resetState();
  });

  it('creates a rating for a mantra', async () => {
    const response = await ratingService.rateMantra(1, 5, 'Great mantra!', 'token');
    expect(response.status).toBe('success');
    expect(response.message).toMatch(/created/i);
    expect(response.data?.rating).toBeDefined();
    expect(response.data?.rating?.mantra_id).toBe(1);
    expect(response.data?.rating?.rating).toBe(5);
    expect(response.data?.rating?.review_text).toBe('Great mantra!');
  });

  it('creates a rating without review text', async () => {
    const response = await ratingService.rateMantra(2, 4, undefined, 'token');
    expect(response.status).toBe('success');
    expect(response.data?.rating?.rating).toBe(4);
    expect(response.data?.rating?.review_text).toBeNull();
  });

  it('gets user rating for a mantra', async () => {
    // Create a rating first
    await ratingService.rateMantra(1, 5, 'Excellent!', 'token');

    const response = await ratingService.getUserRating(1, 'token');
    expect(response.status).toBe('success');
    expect(response.data?.rating).toBeDefined();
    expect(response.data?.rating?.mantra_id).toBe(1);
    expect(response.data?.rating?.rating).toBe(5);
  });

  it('returns null when user has not rated a mantra', async () => {
    const response = await ratingService.getUserRating(999, 'token');
    expect(response.status).toBe('success');
    expect(response.data?.rating).toBeNull();
  });

  it('gets average rating for a mantra', async () => {
    // Create multiple ratings for the same mantra
    await ratingService.rateMantra(1, 5, undefined, 'token');
    await ratingService.rateMantra(1, 4, undefined, 'token');
    await ratingService.rateMantra(1, 3, undefined, 'token');

    const response = await ratingService.getAverageRating(1);
    expect(response.status).toBe('success');
    expect(response.data?.average).toBe(4);
    expect(response.data?.count).toBe(3);
  });

  it('returns zero average when no ratings exist', async () => {
    const response = await ratingService.getAverageRating(999);
    expect(response.status).toBe('success');
    expect(response.data?.average).toBe(0);
    expect(response.data?.count).toBe(0);
  });

  it('deletes a rating successfully', async () => {
    // Create a rating
    const createResponse = await ratingService.rateMantra(1, 5, undefined, 'token');
    const ratingId = createResponse.data?.rating?.rating_id!;

    // Delete it
    const deleteResponse = await ratingService.deleteRating(ratingId, 'token');
    expect(deleteResponse.status).toBe('success');
    expect(deleteResponse.message).toMatch(/deleted/i);

    const getUserResponse = await ratingService.getUserRating(1, 'token');
    expect(getUserResponse.data?.rating).toBeNull();
  });

  it('returns error when deleting non-existent rating', async () => {
    const response = await ratingService.deleteRating(9999, 'token');
    expect(response.status).toBe('error');
    expect(response.message).toMatch(/not found/i);
  });

  it('updates rating by creating a new one (upsert behavior)', async () => {
    // In the real backend, POST /ratings should upsert based on user_id + mantra_id
    // First rating
    const firstResponse = await ratingService.rateMantra(1, 3, 'Okay', 'token');
    expect(firstResponse.data?.rating?.rating).toBe(3);

    // Update rating (in a real scenario, this would update the existing one)
    const secondResponse = await ratingService.rateMantra(1, 5, 'Actually amazing', 'token');
    expect(secondResponse.data?.rating?.rating).toBe(5);
    expect(secondResponse.data?.rating?.review_text).toBe('Actually amazing');
  });

  it('calculates correct average with decimal precision', async () => {
    await ratingService.rateMantra(1, 5, undefined, 'token');
    await ratingService.rateMantra(1, 4, undefined, 'token');

    const response = await ratingService.getAverageRating(1);
    expect(response.status).toBe('success');
    expect(response.data?.average).toBe(4.5);
    expect(response.data?.count).toBe(2);
  });

  it('handles multiple mantras with separate ratings', async () => {
    await ratingService.rateMantra(1, 5, undefined, 'token');
    await ratingService.rateMantra(2, 3, undefined, 'token');
    await ratingService.rateMantra(3, 4, undefined, 'token');

    const avg1 = await ratingService.getAverageRating(1);
    const avg2 = await ratingService.getAverageRating(2);
    const avg3 = await ratingService.getAverageRating(3);

    expect(avg1.data?.average).toBe(5);
    expect(avg2.data?.average).toBe(3);
    expect(avg3.data?.average).toBe(4);
  });

  it('workflow: create, get, update, delete rating', async () => {
    // Create
    const createResp = await ratingService.rateMantra(1, 4, 'Good', 'token');
    expect(createResp.status).toBe('success');
    const ratingId = createResp.data?.rating?.rating_id!;

    const getResp = await ratingService.getUserRating(1, 'token');
    expect(getResp.data?.rating?.rating).toBe(4);

    const updateResp = await ratingService.rateMantra(1, 5, 'Excellent!', 'token');
    expect(updateResp.data?.rating?.rating).toBe(5);

    const deleteResp = await ratingService.deleteRating(ratingId, 'token');
    expect(deleteResp.status).toBe('success');
  });
});
