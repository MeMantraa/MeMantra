import { MessageReportModel } from '../../src/models/messageReport.model';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
  },
}));

describe('MessageReportModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new message report', async () => {
      const mockReport = {
        report_id: 1,
        message_id: 10,
        conversation_id: 5,
        reported_by_id: 2,
        reason: 'spam',
        description: 'This is spam',
        status: 'pending',
        reviewed_by_id: null,
        review_notes: null,
        created_at: '2026-04-08T00:00:00Z',
        reviewed_at: null,
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockReport),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.create({
        message_id: 10,
        conversation_id: 5,
        reported_by_id: 2,
        reason: 'spam',
        description: 'This is spam',
        status: 'pending',
      });

      expect(db.insertInto).toHaveBeenCalledWith('MessageReport');
      expect(result).toEqual(mockReport);
    });

    it('should handle null description', async () => {
      const mockReport = {
        report_id: 1,
        message_id: 10,
        conversation_id: 5,
        reported_by_id: 2,
        reason: 'harassment',
        description: null,
        status: 'pending',
        created_at: '2026-04-08T00:00:00Z',
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockReport),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.create({
        message_id: 10,
        conversation_id: 5,
        reported_by_id: 2,
        reason: 'harassment',
        status: 'pending',
      });

      expect(result).toEqual(mockReport);
    });
  });

  describe('findById', () => {
    it('should find a report by ID', async () => {
      const mockReport = {
        report_id: 1,
        message_id: 10,
        conversation_id: 5,
        reported_by_id: 2,
        reason: 'spam',
        status: 'pending',
        created_at: '2026-04-08T00:00:00Z',
      };

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockReport),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('MessageReport');
      expect(mockChain.where).toHaveBeenCalledWith('report_id', '=', 1);
      expect(result).toEqual(mockReport);
    });

    it('should return undefined if report not found', async () => {
      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should find all reports without status filter', async () => {
      const mockReports = [
        { report_id: 1, status: 'pending' },
        { report_id: 2, status: 'accepted' },
      ];

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReports),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.findAll();

      expect(mockChain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(mockChain.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockReports);
    });

    it('should find reports filtered by status', async () => {
      const mockReports = [{ report_id: 1, status: 'pending' }];

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReports),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.findAll('pending', 20, 10);

      expect(mockChain.where).toHaveBeenCalledWith('status', '=', 'pending');
      expect(mockChain.limit).toHaveBeenCalledWith(20);
      expect(mockChain.offset).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockReports);
    });
  });

  describe('countByStatus', () => {
    it('should count all reports without status filter', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: 5 }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.countByStatus();

      expect(result).toBe(5);
    });

    it('should count reports filtered by status', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: 2 }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.countByStatus('pending');

      expect(mockChain.where).toHaveBeenCalledWith('status', '=', 'pending');
      expect(result).toBe(2);
    });

    it('should return 0 if count query returns null', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(null),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.countByStatus();

      expect(result).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update report status', async () => {
      const mockUpdatedReport = {
        report_id: 1,
        status: 'accepted',
        reviewed_by_id: 5,
        review_notes: 'Approved',
        reviewed_at: '2026-04-08T12:00:00Z',
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockUpdatedReport),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.updateStatus(1, 'accepted', 5, 'Approved');

      expect(db.updateTable).toHaveBeenCalledWith('MessageReport');
      expect(mockChain.where).toHaveBeenCalledWith('report_id', '=', 1);
      expect(result).toEqual(mockUpdatedReport);
    });

    it('should handle undefined reviewedById and reviewNotes', async () => {
      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ report_id: 1 }),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      await MessageReportModel.updateStatus(1, 'denied');

      const setCall = mockChain.set.mock.calls[0][0];
      expect(setCall.reviewed_by_id).toBeNull();
      expect(setCall.review_notes).toBeNull();
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ report_id: 1 }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.deleteReport(1);

      expect(db.deleteFrom).toHaveBeenCalledWith('MessageReport');
      expect(mockChain.where).toHaveBeenCalledWith('report_id', '=', 1);
      expect(result).toEqual({ report_id: 1 });
    });
  });

  describe('findByMessageId', () => {
    it('should find all reports for a message', async () => {
      const mockReports = [
        { report_id: 1, message_id: 10 },
        { report_id: 2, message_id: 10 },
      ];

      const mockChain = {
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockReports),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await MessageReportModel.findByMessageId(10);

      expect(mockChain.where).toHaveBeenCalledWith('message_id', '=', 10);
      expect(result).toEqual(mockReports);
    });
  });
});
