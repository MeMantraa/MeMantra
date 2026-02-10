import { JournalModel } from '../../src/models/journal.model';
import { db } from '../../src/db';
import { JournalEntry } from '../../src/types/database.types';

jest.mock('../../src/db', () => ({
  db: {
    insertInto: jest.fn(),
    selectFrom: jest.fn(),
    updateTable: jest.fn(),
    deleteFrom: jest.fn(),
    fn: {
      count: jest.fn(() => ({
        as: jest.fn((alias: string) => `count_${alias}`),
      })),
    },
  },
}));

describe('JournalModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new journal entry with all fields', async () => {
      const mockJournal: JournalEntry = {
        journal_id: 1,
        user_id: 1,
        title: 'My Journal',
        content: 'Journal content',
        mood: 'happy',
        mantra_id: 5,
        tags: null,
        is_private: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockJournal),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.create({
        user_id: 1,
        title: 'My Journal',
        content: 'Journal content',
        mood: 'happy',
        mantra_id: 5,
        is_private: true,
      });

      expect(db.insertInto).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          title: 'My Journal',
          content: 'Journal content',
          mood: 'happy',
          mantra_id: 5,
          is_private: true,
        })
      );
      expect(result).toEqual(mockJournal);
    });

    it('should create with default is_private true', async () => {
      const mockJournal: JournalEntry = {
        journal_id: 1,
        user_id: 1,
        title: 'Minimal Journal',
        content: 'Minimal content',
        mood: null,
        mantra_id: null,
        tags: null,
        is_private: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockJournal),
      };

      (db.insertInto as jest.Mock).mockReturnValue(mockChain);

      await JournalModel.create({
        user_id: 1,
        title: 'Minimal Journal',
        content: 'Minimal content',
      });

      expect(mockChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          is_private: true,
        })
      );
    });
  });

  describe('findById', () => {
    it('should find journal entry by id', async () => {
      const mockJournal: JournalEntry = {
        journal_id: 1,
        user_id: 1,
        title: 'Found Journal',
        content: 'Found content',
        mood: 'happy',
        mantra_id: null,
        tags: null,
        is_private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockJournal),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.findById(1);

      expect(db.selectFrom).toHaveBeenCalledWith('JournalEntry');
      expect(result).toEqual(mockJournal);
    });
  });

  describe('findByUserId', () => {
    it('should find journal entries by user id', async () => {
      const mockJournals: JournalEntry[] = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Journal 1',
          content: 'Content 1',
          mood: 'happy',
          mantra_id: null,
          tags: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockJournals),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.findByUserId(1, 50, 0);

      expect(db.selectFrom).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(result).toEqual(mockJournals);
    });
  });

  describe('findByMantraId', () => {
    it('should find journal entries by mantra id', async () => {
      const mockJournals: JournalEntry[] = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Mantra Reflection',
          content: 'Reflecting on my mantra',
          mood: 'peaceful',
          mantra_id: 5,
          tags: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockJournals),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.findByMantraId(5, 1);

      expect(db.selectFrom).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.where).toHaveBeenCalledWith('mantra_id', '=', 5);
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toEqual(mockJournals);
    });
  });

  describe('findByUserIdWithMantra', () => {
    it('should find journal entries with mantra details', async () => {
      const mockJournals = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Mantra Journal',
          content: 'Content',
          mood: 'peaceful',
          mantra_id: 5,
          tags: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          mantra_title: 'I am peaceful',
          mantra_key_takeaway: 'Stay calm',
        },
      ];

      const mockChain = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockJournals),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.findByUserIdWithMantra(1, 50, 0);

      expect(db.selectFrom).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.leftJoin).toHaveBeenCalledWith('Mantra', 'JournalEntry.mantra_id', 'Mantra.mantra_id');
      expect(mockChain.where).toHaveBeenCalledWith('JournalEntry.user_id', '=', 1);
      expect(result).toEqual(mockJournals);
    });
  });

  describe('update', () => {
    it('should update a journal entry', async () => {
      const mockUpdatedJournal: JournalEntry = {
        journal_id: 1,
        user_id: 1,
        title: 'Updated Title',
        content: 'Updated content',
        mood: 'excited',
        mantra_id: null,
        tags: null,
        is_private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returningAll: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(mockUpdatedJournal),
      };

      (db.updateTable as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.update(1, 1, {
        title: 'Updated Title',
        content: 'Updated content',
        mood: 'excited',
      });

      expect(db.updateTable).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.where).toHaveBeenCalledWith('journal_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toEqual(mockUpdatedJournal);
    });
  });

  describe('delete', () => {
    it('should delete a journal entry and return true', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(1) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.delete(1, 1);

      expect(db.deleteFrom).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.where).toHaveBeenCalledWith('journal_id', '=', 1);
      expect(result).toBe(true);
    });

    it('should return false when entry not found', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ numDeletedRows: BigInt(0) }),
      };

      (db.deleteFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.delete(999, 1);

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search journal entries by title or content', async () => {
      const mockJournals: JournalEntry[] = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Meditation Journal',
          content: 'About my practice',
          mood: 'calm',
          mantra_id: null,
          tags: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockJournals),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.search(1, 'meditation', 20);

      expect(db.selectFrom).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toEqual(mockJournals);
    });
  });

  describe('findByMood', () => {
    it('should find journal entries by mood', async () => {
      const mockJournals: JournalEntry[] = [
        {
          journal_id: 1,
          user_id: 1,
          title: 'Happy Day',
          content: 'Feeling great',
          mood: 'happy',
          mantra_id: null,
          tags: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockChain = {
        where: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockJournals),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.findByMood(1, 'happy');

      expect(db.selectFrom).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(mockChain.where).toHaveBeenCalledWith('mood', '=', 'happy');
      expect(result).toEqual(mockJournals);
    });
  });

  describe('countByUserId', () => {
    it('should count journal entries for a user', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: '42' }),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.countByUserId(1);

      expect(db.selectFrom).toHaveBeenCalledWith('JournalEntry');
      expect(mockChain.where).toHaveBeenCalledWith('user_id', '=', 1);
      expect(result).toBe(42);
    });

    it('should return 0 when user has no entries', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(undefined),
      };

      (db.selectFrom as jest.Mock).mockReturnValue(mockChain);

      const result = await JournalModel.countByUserId(999);

      expect(result).toBe(0);
    });
  });
});

