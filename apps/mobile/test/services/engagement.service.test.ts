import { engagementService } from '../../services/engagement.service';
import { apiClient } from '../../services/api.config';

jest.mock('../../services/api.config', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedPost = apiClient.post as jest.Mock;
const mockedGet = apiClient.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('engagementService', () => {
  describe('trackEvent', () => {
    it('posts the event type to /engagement/event', async () => {
      mockedPost.mockResolvedValue({ data: {} });

      await engagementService.trackEvent('mantra_like');

      expect(mockedPost).toHaveBeenCalledWith('/engagement/event', { event_type: 'mantra_like' });
    });

    it('silently swallows errors (never throws)', async () => {
      mockedPost.mockRejectedValue(new Error('network error'));

      await expect(engagementService.trackEvent('app_open')).resolves.toBeUndefined();
    });

    it('does not throw when API returns non-2xx', async () => {
      mockedPost.mockRejectedValue({ response: { status: 500 } });

      await expect(engagementService.trackEvent('journal_create')).resolves.toBeUndefined();
    });
  });

  describe('trackAppOpen', () => {
    it('calls trackEvent with app_open', async () => {
      mockedPost.mockResolvedValue({ data: {} });

      await engagementService.trackAppOpen();

      expect(mockedPost).toHaveBeenCalledWith('/engagement/event', { event_type: 'app_open' });
    });
  });

  describe('getAnalytics', () => {
    const fakeAnalytics = {
      window_days: 30,
      event_counts: { app_open: 5 },
      notification_effectiveness: {
        sent: 10,
        taps: 3,
        tap_through_rate_pct: 30,
        post_tap_conversion_rate_pct: null,
      },
      tap_by_hour: [{ hour: 9, count: 2 }],
      adaptive_timing: { users_with_optimal_hour: 1, users_using_default: 2 },
    };

    it('fetches analytics with default 30 days when days not provided', async () => {
      mockedGet.mockResolvedValue({ data: { status: 'success', data: fakeAnalytics } });

      const result = await engagementService.getAnalytics('my-token');

      expect(mockedGet).toHaveBeenCalledWith('/engagement/analytics', {
        headers: { Authorization: 'Bearer my-token' },
        params: { days: 30 },
      });
      expect(result.data).toEqual(fakeAnalytics);
    });

    it('uses the provided days parameter', async () => {
      mockedGet.mockResolvedValue({ data: { status: 'success', data: fakeAnalytics } });

      await engagementService.getAnalytics('tok', 7);

      expect(mockedGet).toHaveBeenCalledWith('/engagement/analytics', {
        headers: { Authorization: 'Bearer tok' },
        params: { days: 7 },
      });
    });

    it('propagates errors from the API', async () => {
      mockedGet.mockRejectedValue(new Error('unauthorized'));

      await expect(engagementService.getAnalytics('bad-token')).rejects.toThrow('unauthorized');
    });
  });
});
