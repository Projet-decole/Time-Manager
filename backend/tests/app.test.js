// backend/tests/app.test.js

const request = require('supertest');
const app = require('../app');

describe('Express App Configuration', () => {
  describe('Middleware Configuration', () => {
    it('should parse JSON body correctly', async () => {
      // Create a temporary route to test JSON parsing
      // We'll use a POST to an existing endpoint and verify the body is parsed
      const testData = { name: 'test', value: 123 };

      // The health endpoint doesn't accept POST, but we can verify
      // JSON parsing by checking the request doesn't fail with parse error
      const response = await request(app)
        .post('/nonexistent')
        .send(testData)
        .set('Content-Type', 'application/json');

      // Should return 404 (not 400 parse error)
      expect(response.status).toBe(404);
      // Body should be JSON format (our 404 handler)
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject malformed JSON with 400 error', async () => {
      const response = await request(app)
        .post('/health')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      // Express JSON parser should reject malformed JSON
      expect(response.status).toBe(400);
    });

    it('should have CORS enabled', async () => {
      const response = await request(app).get('/health');

      // CORS headers should be present
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('404 Error Handling', () => {
    it('should return JSON format for unknown routes', async () => {
      const response = await request(app).get('/unknown-route-xyz');

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return standard error format for 404', async () => {
      const response = await request(app).get('/this-route-does-not-exist');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('/this-route-does-not-exist');
    });

    it('should include HTTP method in 404 message', async () => {
      const response = await request(app).delete('/some-path');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('DELETE');
      expect(response.body.error.message).toContain('/some-path');
    });
  });
});
