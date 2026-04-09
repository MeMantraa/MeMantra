import { Request, Response } from 'express';

export const ReportController = {
  async reportContent(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { message_id, conversation_id, reason } = req.body;

      if (!message_id || !conversation_id) {
        return res.status(400).json({
          status: 'error',
          message: 'message_id and conversation_id are required',
        });
      }

      // Sanitize user input before logging to prevent log injection
      const sanitize = (val: unknown) =>
        String(val)
          .replace(/[\n\r\t]/g, ' ')
          .slice(0, 500);

      // Log the report for review
      console.log(
        `[REPORT] User ${userId} reported message ${sanitize(message_id)} in conversation ${sanitize(conversation_id)}. Reason: ${sanitize(reason || 'No reason provided')}`,
      );

      return res.status(200).json({
        status: 'success',
        message: 'Report submitted successfully. Our team will review it within 24 hours.',
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to submit report',
      });
    }
  },
};
