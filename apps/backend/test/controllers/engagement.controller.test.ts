import { Request, Response } from 'express';
import { EngagementController } from '../../src/controllers/engagement.controller';
import { EngagementModel, EngagementAnalytics } from '../../src/models/engagement.model';

jest.mock('../../src/models/engagement.model');

const mockedEngagementModel = EngagementModel as jest.Mocked<typeof EngagementModel>;

const mockAnalytics: EngagementAnalytics = {
  window_days: 30,
  event_counts: { notification_sent: 100, notification_tap_recommendation: 42 },
  notification_effectiveness: {
    sent: 100,
    taps: 42,
    tap_through_rate_pct: 42,
    post_tap_conversion_rate_pct: 61.9,
  },
  tap_by_hour: [{ hour: 9, count: 42 }],
  adaptive_timing: { users_with_optimal_hour: 10, users_using_default: 5 },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: { userId: 1 },
    body: { event_type: 'app_open' },
    ...overrides,
  }) as unknown as Request;

// ─── tests ────────────────────────────────────────────────────────────────────

describe('EngagementController.getAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns analytics with default 30-day window', async () => {
    mockedEngagementModel.getAnalytics.mockResolvedValue(mockAnalytics);
    const req = { query: {} } as unknown as Request;
    const res = makeRes();

    await EngagementController.getAnalytics(req, res);

    expect(mockedEngagementModel.getAnalytics).toHaveBeenCalledWith(30);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: mockAnalytics });
  });

  it('passes a custom days query param to the model', async () => {
    mockedEngagementModel.getAnalytics.mockResolvedValue(mockAnalytics);
    const req = { query: { days: '7' } } as unknown as Request;
    const res = makeRes();

    await EngagementController.getAnalytics(req, res);

    expect(mockedEngagementModel.getAnalytics).toHaveBeenCalledWith(7);
  });

  it('clamps days to a minimum of 1', async () => {
    mockedEngagementModel.getAnalytics.mockResolvedValue(mockAnalytics);
    const req = { query: { days: '-5' } } as unknown as Request;
    const res = makeRes();

    await EngagementController.getAnalytics(req, res);

    expect(mockedEngagementModel.getAnalytics).toHaveBeenCalledWith(1);
  });

  it('returns 500 when the model throws', async () => {
    mockedEngagementModel.getAnalytics.mockRejectedValue(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const req = { query: {} } as unknown as Request;
    const res = makeRes();

    await EngagementController.getAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });
});

describe('EngagementController.trackEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns recorded: true when a new event is stored', async () => {
    const storedEvent = {
      event_id: 1,
      user_id: 1,
      event_type: 'app_open',
      occurred_at: new Date().toISOString(),
    };
    mockedEngagementModel.create.mockResolvedValue(storedEvent);

    const req = makeReq();
    const res = makeRes();

    await EngagementController.trackEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { recorded: true },
    });
  });

  it('returns recorded: false when the event is de-duplicated (model returns undefined)', async () => {
    mockedEngagementModel.create.mockResolvedValue(undefined);

    const req = makeReq();
    const res = makeRes();

    await EngagementController.trackEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { recorded: false },
    });
  });

  it('returns 401 when the request has no auth', async () => {
    const req = makeReq({ user: undefined });
    const res = makeRes();

    await EngagementController.trackEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Authentication required',
    });
    expect(mockedEngagementModel.create).not.toHaveBeenCalled();
  });

  it('returns 500 when the model throws', async () => {
    mockedEngagementModel.create.mockRejectedValue(new Error('DB error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const req = makeReq();
    const res = makeRes();

    await EngagementController.trackEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });

    consoleSpy.mockRestore();
  });
});
