import request from 'supertest';
import express from 'express';
import { ReportController } from '../../src/controllers/report.controller';

const app = express();
app.use(express.json());

const mockAuthMiddleware = (req: any, _res: any, next: any) => {
  req.user = { userId: 1 };
  next();
};

const noAuthMiddleware = (_req: any, _res: any, next: any) => {
  next();
};

app.post('/api/report', mockAuthMiddleware, ReportController.reportContent);
app.post('/api/report-noauth', noAuthMiddleware, ReportController.reportContent);

describe('ReportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const res = await request(app).post('/api/report-noauth').send({
      message_id: 1,
      conversation_id: 1,
    });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Authentication required');
  });

  it('should return 400 if message_id is missing', async () => {
    const res = await request(app).post('/api/report').send({
      conversation_id: 1,
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('message_id and conversation_id are required');
  });

  it('should return 400 if conversation_id is missing', async () => {
    const res = await request(app).post('/api/report').send({
      message_id: 1,
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('message_id and conversation_id are required');
  });

  it('should successfully submit a report with reason', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const res = await request(app).post('/api/report').send({
      message_id: 42,
      conversation_id: 7,
      reason: 'Inappropriate content',
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toContain('Report submitted successfully');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[REPORT] User 1 reported message 42'),
    );

    consoleSpy.mockRestore();
  });

  it('should successfully submit a report without reason', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const res = await request(app).post('/api/report').send({
      message_id: 10,
      conversation_id: 3,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No reason provided'));

    consoleSpy.mockRestore();
  });

  it('should sanitize newlines in user input to prevent log injection', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const res = await request(app).post('/api/report').send({
      message_id: 1,
      conversation_id: 1,
      reason: 'bad\ninjected\rlog\tentry',
    });

    expect(res.status).toBe(200);

    const logCall = consoleSpy.mock.calls[0][0] as string;
    expect(logCall).not.toContain('\n');
    expect(logCall).not.toContain('\r');
    expect(logCall).not.toContain('\t');

    consoleSpy.mockRestore();
  });

  it('should handle errors in catch block and return 500', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('Simulated logging error');
    });

    const res = await request(app).post('/api/report').send({
      message_id: 1,
      conversation_id: 1,
      reason: 'spam',
    });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Failed to submit report');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error submitting report:'),
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should truncate very long input values at 500 characters', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const longValue = 'x'.repeat(1000);

    const res = await request(app).post('/api/report').send({
      message_id: longValue,
      conversation_id: 1,
      reason: 'spam',
    });

    expect(res.status).toBe(200);

    const logCall = consoleSpy.mock.calls[0][0] as string;
    // Check that the long value was truncated to 500 chars in the log
    expect(logCall).toContain('x'.repeat(500));

    consoleSpy.mockRestore();
  });

  it('should handle non-string input values in sanitize function', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const res = await request(app).post('/api/report').send({
      message_id: 12345,
      conversation_id: 67890,
      reason: null,
    });

    expect(res.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[REPORT] User 1'));

    consoleSpy.mockRestore();
  });

  it('should handle special characters in reason field', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const res = await request(app).post('/api/report').send({
      message_id: 1,
      conversation_id: 1,
      reason: '<script>alert("xss")</script> & special chars @#$%',
    });

    expect(res.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[REPORT]'));

    consoleSpy.mockRestore();
  });
});
