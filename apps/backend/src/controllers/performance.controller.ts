import { Request, Response } from 'express';
import { PerformanceMonitor } from '../services/performance-monitor.service';
import { PerformanceEventModel } from '../models/performance-event.model';

export const PerformanceController = {
  async trackEvent(req: Request, res: Response) {
    try {
      PerformanceMonitor.trackEvent({
        kind: req.body.kind,
        name: req.body.name,
        duration_ms: req.body.duration_ms,
        status: req.body.status,
        source: req.body.source || 'mobile',
        route: req.body.route,
        method: req.body.method,
        screen: req.body.screen,
        request_id: req.body.request_id,
        platform: req.body.platform,
        app_version: req.body.app_version,
        metadata: req.body.metadata,
      });

      return res.status(200).json({ status: 'success', data: { recorded: true } });
    } catch (error) {
      console.error('Error tracking performance event:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  async getSummary(req: Request, res: Response) {
    try {
      const windowHours = Math.max(1, Number(req.query.hours) || 24);
      const summary = await PerformanceEventModel.getSummary(windowHours);

      return res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      console.error('Error fetching performance summary:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};
