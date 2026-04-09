import { db } from '../db';
import { sql } from 'kysely';

export interface MessageReport {
  report_id: number;
  message_id: number;
  conversation_id: number;
  reported_by_id: number;
  reason:
    | 'inappropriate_language'
    | 'harassment'
    | 'spam'
    | 'offensive_content'
    | 'misinformation'
    | 'other';
  description?: string;
  status: 'pending' | 'accepted' | 'denied' | 'reviewed';
  reviewed_by_id?: number;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export const MessageReportModel = {
  async create(data: Omit<MessageReport, 'report_id' | 'created_at' | 'reviewed_at'>) {
    return db
      .insertInto('MessageReport')
      .values({
        message_id: data.message_id,
        conversation_id: data.conversation_id,
        reported_by_id: data.reported_by_id,
        reason: data.reason,
        description: data.description || null,
        status: data.status,
        reviewed_by_id: data.reviewed_by_id || null,
        review_notes: data.review_notes || null,
      })
      .returningAll()
      .executeTakeFirst();
  },

  async findById(reportId: number) {
    return db
      .selectFrom('MessageReport')
      .selectAll()
      .where('report_id', '=', reportId)
      .executeTakeFirst();
  },

  async findAll(status?: string, limit: number = 50, offset: number = 0) {
    let query = db.selectFrom('MessageReport').selectAll();

    if (status) {
      query = query.where('status', '=', status as any);
    }

    return query.orderBy('created_at', 'desc').limit(limit).offset(offset).execute();
  },

  async countByStatus(status?: string) {
    let query = db.selectFrom('MessageReport').select(sql`count(*)`.as('count'));

    if (status) {
      query = query.where('status', '=', status as any);
    }

    const result = await query.executeTakeFirst();
    return result?.count ? Number(result.count) : 0;
  },

  async updateStatus(
    reportId: number,
    status: string,
    reviewedById?: number,
    reviewNotes?: string,
  ) {
    return db
      .updateTable('MessageReport')
      .set({
        status: status as any,
        reviewed_by_id: reviewedById || null,
        review_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .where('report_id', '=', reportId)
      .returningAll()
      .executeTakeFirst();
  },

  async deleteReport(reportId: number) {
    return db.deleteFrom('MessageReport').where('report_id', '=', reportId).executeTakeFirst();
  },

  async findByMessageId(messageId: number) {
    return db.selectFrom('MessageReport').selectAll().where('message_id', '=', messageId).execute();
  },
};
