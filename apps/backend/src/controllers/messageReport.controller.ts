import { Request, Response } from 'express';
import { MessageReportModel } from '../models/messageReport.model';
import { UserBlockModel } from '../models/userBlock.model';
import { MessageModel } from '../models/message.model';
import { ConversationModel } from '../models/conversation.model';
import { UserModel } from '../models/user.model';

export const MessageReportController = {
  // POST /api/report/message - Report a message
  async reportMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { message_id, conversation_id, reason, description } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      if (!message_id || !conversation_id || !reason) {
        return res.status(400).json({
          status: 'error',
          message: 'message_id, conversation_id, and reason are required',
        });
      }

      // Validate reason
      const validReasons = [
        'inappropriate_language',
        'harassment',
        'spam',
        'offensive_content',
        'misinformation',
        'other',
      ];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid reason provided',
        });
      }

      // Verify message exists and user is in conversation
      const message = await MessageModel.findById(message_id);
      if (!message) {
        return res.status(404).json({
          status: 'error',
          message: 'Message not found',
        });
      }

      const isParticipant = await ConversationModel.isParticipant(conversation_id, userId);
      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const report = await MessageReportModel.create({
        message_id,
        conversation_id,
        reported_by_id: userId,
        reason: reason as any,
        description: description || undefined,
        status: 'pending',
      });

      return res.status(201).json({
        status: 'success',
        message: 'Report submitted successfully',
        data: { report },
      });
    } catch (error) {
      console.error('Error reporting message:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to submit report',
      });
    }
  },

  // GET /api/report/message - Get all message reports (admin only)
  async getAllReports(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { status } = req.query;
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if user is admin (you might want to add an admin check here)
      const reports = await MessageReportModel.findAll(status as string | undefined, limit, offset);
      const total = await MessageReportModel.countByStatus(status as string | undefined);

      return res.status(200).json({
        status: 'success',
        data: {
          reports,
          pagination: {
            limit,
            offset,
            total,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reports',
      });
    }
  },

  // GET /api/report/message/:id - Get a specific report
  async getReportById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const report = await MessageReportModel.findById(Number(id));
      if (!report) {
        return res.status(404).json({
          status: 'error',
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch report',
      });
    }
  },

  // PUT /api/report/message/:id - Update report status (admin only)
  async updateReportStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { status, review_notes } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      if (!status) {
        return res.status(400).json({
          status: 'error',
          message: 'status is required',
        });
      }

      const validStatuses = ['pending', 'accepted', 'denied', 'reviewed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status',
        });
      }

      const report = await MessageReportModel.updateStatus(
        Number(id),
        status,
        userId,
        review_notes || undefined,
      );

      if (!report) {
        return res.status(404).json({
          status: 'error',
          message: 'Report not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Report updated successfully',
        data: { report },
      });
    } catch (error) {
      console.error('Error updating report:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update report',
      });
    }
  },

  // DELETE /api/report/message/:id - Delete a report (admin only)
  async deleteReport(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      await MessageReportModel.deleteReport(Number(id));

      return res.status(200).json({
        status: 'success',
        message: 'Report deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete report',
      });
    }
  },
};

export const UserBlockController = {
  // POST /api/user/block/:userId - Block a user
  async blockUser(req: Request, res: Response) {
    try {
      const blockerId = req.user?.userId;
      const { userId } = req.params;
      const blockedId = Number(userId);

      if (!blockerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      if (blockerId === blockedId) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot block yourself',
        });
      }

      // Check if user exists
      const user = await UserModel.findById(blockedId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      const block = await UserBlockModel.blockUser(blockerId, blockedId);

      return res.status(201).json({
        status: 'success',
        message: 'User blocked successfully',
        data: { block },
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to block user',
      });
    }
  },

  // DELETE /api/user/block/:userId - Unblock a user
  async unblockUser(req: Request, res: Response) {
    try {
      const blockerId = req.user?.userId;
      const { userId } = req.params;
      const blockedId = Number(userId);

      if (!blockerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      await UserBlockModel.unblockUser(blockerId, blockedId);

      return res.status(200).json({
        status: 'success',
        message: 'User unblocked successfully',
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to unblock user',
      });
    }
  },

  // GET /api/user/blocked - Get all blocked users
  async getBlockedUsers(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const blockedUsers = await UserBlockModel.getBlockedUsers(userId);

      return res.status(200).json({
        status: 'success',
        data: { blockedUsers },
      });
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch blocked users',
      });
    }
  },

  // GET /api/user/is-blocked/:userId - Check if user is blocked
  async isBlocked(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { userId: targetUserId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const blocked = await UserBlockModel.isBlocked(userId, Number(targetUserId));

      return res.status(200).json({
        status: 'success',
        data: { blocked },
      });
    } catch (error) {
      console.error('Error checking block status:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to check block status',
      });
    }
  },
};
