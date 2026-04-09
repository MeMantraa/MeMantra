import {
  MessageReportController,
  UserBlockController,
} from '../../src/controllers/messageReport.controller';
import { MessageReportModel } from '../../src/models/messageReport.model';
import { UserBlockModel } from '../../src/models/userBlock.model';
import { MessageModel } from '../../src/models/message.model';
import { ConversationModel } from '../../src/models/conversation.model';
import { UserModel } from '../../src/models/user.model';
import { Request, Response } from 'express';

jest.mock('../../src/models/messageReport.model');
jest.mock('../../src/models/userBlock.model');
jest.mock('../../src/models/message.model');
jest.mock('../../src/models/conversation.model');
jest.mock('../../src/models/user.model');

describe('MessageReportController', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 1 },
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('reportMessage', () => {
    it('should report a message successfully', async () => {
      const reportData = {
        message_id: 10,
        conversation_id: 5,
        reason: 'spam',
        description: 'This is spam',
      };

      mockRequest.body = reportData;
      (MessageModel.findById as jest.Mock).mockResolvedValue({ message_id: 10 });
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(true);
      (MessageReportModel.create as jest.Mock).mockResolvedValue({
        report_id: 1,
        ...reportData,
        reported_by_id: 1,
        status: 'pending',
      });

      await MessageReportController.reportMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.any(String),
        }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await MessageReportController.reportMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = { reason: 'spam' };

      await MessageReportController.reportMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid reason', async () => {
      mockRequest.body = {
        message_id: 10,
        conversation_id: 5,
        reason: 'invalid_reason',
      };

      await MessageReportController.reportMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if message not found', async () => {
      mockRequest.body = {
        message_id: 10,
        conversation_id: 5,
        reason: 'spam',
      };

      (MessageModel.findById as jest.Mock).mockResolvedValue(null);

      await MessageReportController.reportMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if user is not a participant', async () => {
      mockRequest.body = {
        message_id: 10,
        conversation_id: 5,
        reason: 'spam',
      };

      (MessageModel.findById as jest.Mock).mockResolvedValue({ message_id: 10 });
      (ConversationModel.isParticipant as jest.Mock).mockResolvedValue(false);

      await MessageReportController.reportMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.body = {
        message_id: 10,
        conversation_id: 5,
        reason: 'spam',
      };

      (MessageModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await MessageReportController.reportMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to submit report',
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getAllReports', () => {
    it('should get all reports', async () => {
      mockRequest.query = { limit: '50', offset: '0' };
      (MessageReportModel.findAll as jest.Mock).mockResolvedValue([
        { report_id: 1, status: 'pending' },
      ]);
      (MessageReportModel.countByStatus as jest.Mock).mockResolvedValue(1);

      await MessageReportController.getAllReports(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            reports: expect.any(Array),
            pagination: expect.any(Object),
          }),
        }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await MessageReportController.getAllReports(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should filter by status', async () => {
      mockRequest.query = { status: 'pending' };
      (MessageReportModel.findAll as jest.Mock).mockResolvedValue([]);
      (MessageReportModel.countByStatus as jest.Mock).mockResolvedValue(0);

      await MessageReportController.getAllReports(mockRequest as Request, mockResponse as Response);

      expect(MessageReportModel.findAll).toHaveBeenCalledWith('pending', 50, 0);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.query = { limit: '50', offset: '0' };
      (MessageReportModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await MessageReportController.getAllReports(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to fetch reports',
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getReportById', () => {
    it('should get a report by ID', async () => {
      mockRequest.params = { id: '1' };
      (MessageReportModel.findById as jest.Mock).mockResolvedValue({
        report_id: 1,
        status: 'pending',
      });

      await MessageReportController.getReportById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should return 404 if report not found', async () => {
      mockRequest.params = { id: '999' };
      (MessageReportModel.findById as jest.Mock).mockResolvedValue(null);

      await MessageReportController.getReportById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: '1' };

      await MessageReportController.getReportById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { id: '1' };
      (MessageReportModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await MessageReportController.getReportById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to fetch report',
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('updateReportStatus', () => {
    it('should update report status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'accepted', review_notes: 'Approved' };
      (MessageReportModel.updateStatus as jest.Mock).mockResolvedValue({
        report_id: 1,
        status: 'accepted',
      });

      await MessageReportController.updateReportStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should return 400 if status is missing', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      await MessageReportController.updateReportStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'invalid_status' };

      await MessageReportController.updateReportStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if report not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'accepted' };
      (MessageReportModel.updateStatus as jest.Mock).mockResolvedValue(null);

      await MessageReportController.updateReportStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'accepted' };

      await MessageReportController.updateReportStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'accepted' };
      (MessageReportModel.updateStatus as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await MessageReportController.updateReportStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to update report',
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      mockRequest.params = { id: '1' };
      (MessageReportModel.deleteReport as jest.Mock).mockResolvedValue({
        report_id: 1,
      });

      await MessageReportController.deleteReport(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: '1' };

      await MessageReportController.deleteReport(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { id: '1' };
      (MessageReportModel.deleteReport as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await MessageReportController.deleteReport(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to delete report',
        }),
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('UserBlockController', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 1 },
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      mockRequest.params = { userId: '2' };
      (UserModel.findById as jest.Mock).mockResolvedValue({ user_id: 2 });
      (UserBlockModel.blockUser as jest.Mock).mockResolvedValue({
        block_id: 1,
        blocker_id: 1,
        blocked_id: 2,
      });

      await UserBlockController.blockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should return 400 if trying to block self', async () => {
      mockRequest.params = { userId: '1' };

      await UserBlockController.blockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { userId: '999' };
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await UserBlockController.blockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { userId: '2' };

      await UserBlockController.blockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { userId: '2' };
      (UserModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await UserBlockController.blockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to block user',
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      mockRequest.params = { userId: '2' };
      (UserBlockModel.unblockUser as jest.Mock).mockResolvedValue({
        block_id: 1,
      });

      await UserBlockController.unblockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { userId: '2' };

      await UserBlockController.unblockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { userId: '2' };
      (UserBlockModel.unblockUser as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await UserBlockController.unblockUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to unblock user',
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getBlockedUsers', () => {
    it('should get all blocked users', async () => {
      (UserBlockModel.getBlockedUsers as jest.Mock).mockResolvedValue([
        { block_id: 1, blocked_id: 2 },
      ]);

      await UserBlockController.getBlockedUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;

      await UserBlockController.getBlockedUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      (UserBlockModel.getBlockedUsers as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await UserBlockController.getBlockedUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to fetch blocked users',
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('isBlocked', () => {
    it('should check if user is blocked', async () => {
      mockRequest.params = { userId: '2' };
      (UserBlockModel.isBlocked as jest.Mock).mockResolvedValue(true);

      await UserBlockController.isBlocked(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: { blocked: true },
        }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { userId: '2' };

      await UserBlockController.isBlocked(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors and return 500', async () => {
      mockRequest.params = { userId: '2' };
      (UserBlockModel.isBlocked as jest.Mock).mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await UserBlockController.isBlocked(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to check block status',
        }),
      );
      consoleSpy.mockRestore();
    });
  });
});
