import { messageReportService, userBlockService } from '../../services/moderation.service';
import { apiClient } from '../../services/api.config';

jest.mock('../../services/api.config');

describe('messageReportService', () => {
  const mockToken = 'test-token-123';
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reportMessage', () => {
    it('should report a message successfully', async () => {
      const payload = {
        message_id: 1,
        conversation_id: 5,
        reason: 'spam' as const,
        description: 'This is spam',
      };

      const mockResponse = {
        data: {
          status: 'success',
          message: 'Report submitted successfully',
          data: {
            report: {
              report_id: 1,
              ...payload,
              reported_by_id: 2,
              status: 'pending',
              created_at: '2026-04-08T00:00:00Z',
            },
          },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.reportMessage(payload, mockToken);

      expect(mockApiClient.post).toHaveBeenCalledWith('/moderation/message', payload, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.status).toBe('success');
      expect(result.data?.report.report_id).toBe(1);
    });

    it('should handle errors when reporting a message', async () => {
      const payload = {
        message_id: 1,
        conversation_id: 5,
        reason: 'harassment' as const,
      };

      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Failed to create report',
          },
        },
      };

      mockApiClient.post.mockRejectedValueOnce(mockError);

      try {
        await messageReportService.reportMessage(payload, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Failed to create report');
      }
    });

    it('should use default error message when error response is missing', async () => {
      const payload = {
        message_id: 1,
        conversation_id: 5,
        reason: 'offensive_content' as const,
      };

      const mockError = new Error('Network error');

      mockApiClient.post.mockRejectedValueOnce(mockError);

      try {
        await messageReportService.reportMessage(payload, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Failed to report message');
        expect(error.status).toBe('error');
      }
    });

    it('should report without description', async () => {
      const payload = {
        message_id: 2,
        conversation_id: 3,
        reason: 'misinformation' as const,
      };

      const mockResponse = {
        data: {
          status: 'success',
          message: 'Report submitted successfully',
          data: { report: { report_id: 2, ...payload } },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.reportMessage(payload, mockToken);

      expect(result.status).toBe('success');
      expect(mockApiClient.post).toHaveBeenCalledWith('/moderation/message', payload, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });
  });

  describe('getAllReports', () => {
    it('should fetch all reports', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            reports: [
              { report_id: 1, status: 'pending' },
              { report_id: 2, status: 'accepted' },
            ],
            pagination: { limit: 50, offset: 0, total: 2 },
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.getAllReports(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/moderation/message', {
        params: { status: undefined, limit: 50, offset: 0 },
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.data.reports.length).toBe(2);
      expect(result.data.pagination.total).toBe(2);
    });

    it('should fetch reports filtered by status', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            reports: [{ report_id: 1, status: 'pending' }],
            pagination: { limit: 50, offset: 0, total: 1 },
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.getAllReports(mockToken, 'pending', 20, 10);

      expect(mockApiClient.get).toHaveBeenCalledWith('/moderation/message', {
        params: { status: 'pending', limit: 20, offset: 10 },
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.data.reports[0].status).toBe('pending');
    });

    it('should handle errors when fetching reports', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Failed to fetch reports',
          },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      try {
        await messageReportService.getAllReports(mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Failed to fetch reports');
      }
    });

    it('should use default limit and offset', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            reports: [],
            pagination: { limit: 50, offset: 0, total: 0 },
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      await messageReportService.getAllReports(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/moderation/message', {
        params: { status: undefined, limit: 50, offset: 0 },
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });
  });

  describe('getReportById', () => {
    it('should fetch a specific report', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            report: {
              report_id: 1,
              message_id: 10,
              conversation_id: 5,
              reason: 'spam',
              status: 'pending',
            },
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.getReportById(1, mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/moderation/message/1', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.data?.report.report_id).toBe(1);
    });

    it('should handle errors when fetching a report', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Report not found',
          },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      try {
        await messageReportService.getReportById(999, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Report not found');
      }
    });
  });

  describe('updateReportStatus', () => {
    it('should update report status successfully', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Report updated successfully',
          data: {
            report: {
              report_id: 1,
              status: 'accepted',
              reviewed_by_id: 5,
              review_notes: 'Approved',
              reviewed_at: '2026-04-08T12:00:00Z',
            },
          },
        },
      };

      mockApiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.updateReportStatus(
        1,
        'accepted',
        mockToken,
        'Approved',
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/moderation/message/1',
        { status: 'accepted', review_notes: 'Approved' },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result.data?.report.status).toBe('accepted');
    });

    it('should update report status without review notes', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            report: { report_id: 1, status: 'denied', review_notes: undefined },
          },
        },
      };

      mockApiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.updateReportStatus(1, 'denied', mockToken);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/moderation/message/1',
        { status: 'denied', review_notes: undefined },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result.status).toBe('success');
    });

    it('should handle errors when updating report status', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Report not found',
          },
        },
      };

      mockApiClient.put.mockRejectedValueOnce(mockError);

      try {
        await messageReportService.updateReportStatus(999, 'accepted', mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
      }
    });

    it('should handle all valid status values', async () => {
      const statuses: Array<'pending' | 'accepted' | 'denied' | 'reviewed'> = [
        'pending',
        'accepted',
        'denied',
        'reviewed',
      ];

      for (const status of statuses) {
        const mockResponse = {
          data: {
            status: 'success',
            data: { report: { report_id: 1, status } },
          },
        };

        mockApiClient.put.mockResolvedValueOnce(mockResponse);

        const result = await messageReportService.updateReportStatus(1, status, mockToken);

        expect(result.data?.report.status).toBe(status);
      }
    });
  });

  describe('deleteReport', () => {
    it('should delete a report successfully', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Report deleted successfully',
        },
      };

      mockApiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await messageReportService.deleteReport(1, mockToken);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/moderation/message/1', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.status).toBe('success');
    });

    it('should handle errors when deleting a report', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Report not found',
          },
        },
      };

      mockApiClient.delete.mockRejectedValueOnce(mockError);

      try {
        await messageReportService.deleteReport(999, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Report not found');
      }
    });

    it('should use default error message on network error', async () => {
      const mockError = new Error('Network timeout');

      mockApiClient.delete.mockRejectedValueOnce(mockError);

      try {
        await messageReportService.deleteReport(1, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Failed to delete report');
      }
    });
  });
});

describe('userBlockService', () => {
  const mockToken = 'test-token-456';
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'User blocked successfully',
          data: {
            blocked: true,
          },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await userBlockService.blockUser(2, mockToken);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/moderation/block/2',
        {},
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result.data?.blocked).toBe(true);
    });

    it('should handle errors when blocking a user', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'User not found',
          },
        },
      };

      mockApiClient.post.mockRejectedValueOnce(mockError);

      try {
        await userBlockService.blockUser(999, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
        expect(error.message).toBe('User not found');
      }
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');

      mockApiClient.post.mockRejectedValueOnce(mockError);

      try {
        await userBlockService.blockUser(2, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Failed to block user');
      }
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user successfully', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'User unblocked successfully',
        },
      };

      mockApiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await userBlockService.unblockUser(2, mockToken);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/moderation/block/2', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.status).toBe('success');
    });

    it('should handle errors when unblocking a user', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Block not found',
          },
        },
      };

      mockApiClient.delete.mockRejectedValueOnce(mockError);

      try {
        await userBlockService.unblockUser(999, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
      }
    });
  });

  describe('getBlockedUsers', () => {
    it('should fetch all blocked users', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            blockedUsers: [
              { block_id: 1, blocked_id: 2 },
              { block_id: 2, blocked_id: 3 },
            ],
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await userBlockService.getBlockedUsers(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/moderation/blocked', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.data?.blockedUsers?.length).toBe(2);
    });

    it('should handle empty blocked users list', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            blockedUsers: [],
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await userBlockService.getBlockedUsers(mockToken);

      expect(result.data?.blockedUsers?.length).toBe(0);
    });

    it('should handle errors when fetching blocked users', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Failed to fetch blocked users',
          },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      try {
        await userBlockService.getBlockedUsers(mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Failed to fetch blocked users');
      }
    });
  });

  describe('isBlocked', () => {
    it('should check if user is blocked - returns true', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            blocked: true,
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await userBlockService.isBlocked(2, mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/moderation/is-blocked/2', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.data?.blocked).toBe(true);
    });

    it('should check if user is blocked - returns false', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            blocked: false,
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await userBlockService.isBlocked(2, mockToken);

      expect(result.data?.blocked).toBe(false);
    });

    it('should handle errors when checking block status', async () => {
      const mockError = {
        response: {
          data: {
            status: 'error',
            message: 'Failed to check block status',
          },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      try {
        await userBlockService.isBlocked(2, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe('error');
        expect(error.message).toBe('Failed to check block status');
      }
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');

      mockApiClient.get.mockRejectedValueOnce(mockError);

      try {
        await userBlockService.isBlocked(2, mockToken);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Failed to check block status');
      }
    });
  });
});

describe('messageReportService - Additional Edge Cases', () => {
  const mockToken = 'test-token-edge';
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle all reason types in reportMessage', async () => {
    const reasons: Array<
      | 'inappropriate_language'
      | 'harassment'
      | 'spam'
      | 'offensive_content'
      | 'misinformation'
      | 'other'
    > = [
      'inappropriate_language',
      'harassment',
      'spam',
      'offensive_content',
      'misinformation',
      'other',
    ];

    for (const reason of reasons) {
      mockApiClient.post.mockResolvedValueOnce({
        data: { status: 'success', data: { report: { report_id: 1, reason } } },
      });

      const result = await messageReportService.reportMessage(
        { message_id: 1, conversation_id: 1, reason },
        mockToken,
      );

      expect(result.status).toBe('success');
    }
  });

  it('should handle maximum pagination limits in getAllReports', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: { reports: [], pagination: { limit: 100, offset: 1000, total: 5000 } },
      },
    });

    const result = await messageReportService.getAllReports(mockToken, undefined, 100, 1000);

    expect(result.data.pagination.total).toBe(5000);
    expect(result.data.pagination.limit).toBe(100);
  });

  it('should handle all valid status transitions in updateReportStatus', async () => {
    const transitions = [
      { from: 'pending', to: 'accepted' },
      { from: 'pending', to: 'denied' },
      { from: 'accepted', to: 'reviewed' },
      { from: 'denied', to: 'reviewed' },
    ];

    for (const transition of transitions) {
      mockApiClient.put.mockResolvedValueOnce({
        data: { status: 'success', data: { report: { report_id: 1, status: transition.to } } },
      });

      const result = await messageReportService.updateReportStatus(1, transition.to, mockToken);

      expect(result.data?.report.status).toBe(transition.to);
    }
  });

  it('should handle review notes with special characters', async () => {
    const specialNotes = 'User violated policy with "quotes" and <tags> & symbols @#$%';

    mockApiClient.put.mockResolvedValueOnce({
      data: { status: 'success', data: { report: { report_id: 1, review_notes: specialNotes } } },
    });

    const result = await messageReportService.updateReportStatus(
      1,
      'accepted',
      mockToken,
      specialNotes,
    );

    expect(result.status).toBe('success');
    expect(mockApiClient.put).toHaveBeenCalledWith(
      '/moderation/message/1',
      { status: 'accepted', review_notes: specialNotes },
      { headers: { Authorization: `Bearer ${mockToken}` } },
    );
  });

  it('should handle concurrent API calls', async () => {
    mockApiClient.post.mockResolvedValue({
      data: { status: 'success', data: { report: { report_id: 1 } } },
    });

    const calls = Array.from({ length: 5 }, (_, i) =>
      messageReportService.reportMessage(
        { message_id: i, conversation_id: i, reason: 'spam' as const },
        mockToken,
      ),
    );

    const results = await Promise.all(calls);

    expect(results).toHaveLength(5);
    expect(results.every((r) => r.status === 'success')).toBe(true);
  });

  it('should handle empty report list', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: { reports: [], pagination: { limit: 50, offset: 0, total: 0 } },
      },
    });

    const result = await messageReportService.getAllReports(mockToken);

    expect(result.data.reports).toHaveLength(0);
    expect(result.data.pagination.total).toBe(0);
  });

  it('should preserve token format in headers', async () => {
    const bearerToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

    mockApiClient.get.mockResolvedValueOnce({
      data: { status: 'success', data: { reports: [] } },
    });

    await messageReportService.getAllReports(bearerToken);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/moderation/message',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${bearerToken}` },
      }),
    );
  });
});

describe('userBlockService - Additional Edge Cases', () => {
  const mockToken = 'test-token-block';
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle large user IDs', async () => {
    const largeUserId = 999999999;

    mockApiClient.post.mockResolvedValueOnce({
      data: { status: 'success', data: { blocked: true } },
    });

    const result = await userBlockService.blockUser(largeUserId, mockToken);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/moderation/block/${largeUserId}`,
      {},
      { headers: { Authorization: `Bearer ${mockToken}` } },
    );
    expect(result.data?.blocked).toBe(true);
  });

  it('should handle rapid block/unblock operations', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      data: { status: 'success' },
    });
    mockApiClient.delete.mockResolvedValueOnce({
      data: { status: 'success' },
    });

    await userBlockService.blockUser(2, mockToken);
    const result = await userBlockService.unblockUser(2, mockToken);

    expect(result.status).toBe('success');
    expect(mockApiClient.post).toHaveBeenCalledTimes(1);
    expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
  });

  it('should handle getBlockedUsers with many results', async () => {
    const manyBlocks = Array.from({ length: 50 }, (_, i) => ({
      block_id: i,
      blocked_id: 100 + i,
    }));

    mockApiClient.get.mockResolvedValueOnce({
      data: { status: 'success', data: { blockedUsers: manyBlocks } },
    });

    const result = await userBlockService.getBlockedUsers(mockToken);

    expect(result.data?.blockedUsers).toHaveLength(50);
    expect(result.data?.blockedUsers[0].block_id).toBe(0);
    expect(result.data?.blockedUsers[49].block_id).toBe(49);
  });

  it('should handle concurrent block status checks', async () => {
    mockApiClient.get.mockResolvedValue({
      data: { status: 'success', data: { blocked: true } },
    });

    const userIds = [2, 3, 4, 5, 6];
    const checks = userIds.map((id) => userBlockService.isBlocked(id, mockToken));

    const results = await Promise.all(checks);

    expect(results).toHaveLength(5);
    expect(results.every((r) => r.data?.blocked === true)).toBe(true);
  });
});
