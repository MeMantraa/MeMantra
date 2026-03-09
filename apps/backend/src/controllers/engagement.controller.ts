import { Request, Response } from 'express';
import { EngagementModel } from '../models/engagement.model';

export const EngagementController = {
  /**
   * GET /api/engagement/analytics?days=30
   * Return aggregate effectiveness metrics. Admin-only.
   */
  async getAnalytics(req: Request, res: Response) {
    try {
      const windowDays = Math.max(1, Number(req.query.days) || 30);
      const analytics = await EngagementModel.getAnalytics(windowDays);
      return res.status(200).json({ status: 'success', data: analytics });
    } catch (error) {
      console.error('Error fetching engagement analytics:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  /**
   * POST /api/engagement/event
   * Record an app-open (or other) engagement event for the authenticated user.
   * Always returns HTTP 200; `recorded: false` indicates the event was de-duplicated.
   */
  async trackEvent(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    try {
      const eventType: string = req.body.event_type ?? 'app_open';
      const event = await EngagementModel.create(userId, eventType);

      return res.status(200).json({
        status: 'success',
        data: { recorded: event !== undefined },
      });
    } catch (error) {
      console.error('Error tracking engagement event:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};
