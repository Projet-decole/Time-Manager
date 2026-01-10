// backend/tests/routes/health.routes.test.js

const request = require('supertest');
const app = require('../../app');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  supabaseAdmin: null,
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Health Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return welcome message with success format', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('message', 'Time Manager API is running!');
      expect(response.body.data).toHaveProperty('version');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status with success format', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should not require authentication', async () => {
      // No Authorization header
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /ready', () => {
    it('should return ready when database is connected', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
      expect(response.body.data.checks).toHaveProperty('database', 'ok');
    });

    it('should return 503 when database is not connected', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Connection failed')
          })
        })
      });

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('not ready');
      expect(response.body.data.checks).toHaveProperty('database', 'failed');
    });

    it('should return 503 when database throws an exception', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Network error'))
        })
      });

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('not ready');
      expect(response.body.data.checks).toHaveProperty('database', 'failed');
    });

    it('should not require authentication', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // No Authorization header
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
