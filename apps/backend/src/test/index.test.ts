import request from 'supertest';
import { createApp } from '../app';
import express from 'express';

describe('Backend API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app).get('/health');
      
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return numeric uptime', async () => {
      const response = await request(app).get('/health');
      
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/hello', () => {
    it('should return 200 and welcome message', async () => {
      const response = await request(app).get('/api/v1/hello');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        message: 'Hello from MeMantra API!' 
      });
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/api/v1/hello');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('Cannot GET /nonexistent');
    });

    it('should return 404 for non-existent POST routes', async () => {
      const response = await request(app).post('/api/fake');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Cannot POST /api/fake');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/hello')
        .set('Origin', 'http://localhost:19006')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
    });

    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/api/v1/hello')
        .set('Origin', 'http://localhost:19006');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Body Parsing', () => {
    it('should parse JSON body', async () => {
      const testData = { test: 'data' };
      
      // Create a test POST endpoint
      app.post('/api/test', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app)
        .post('/api/test')
        .send(testData)
        .set('Content-Type', 'application/json');

      expect(response.body.received).toEqual(testData);
    });
  });

  describe('Error Handler', () => {
    it('should handle errors and return 500', async () => {
      // Create a route that throws an error
      app.get('/api/error-test', () => {
        throw new Error('Test error');
      });

      const response = await request(app).get('/api/error-test');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message');
    });
  });
});