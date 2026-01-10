// backend/tests/middleware/error.middleware.test.js

const errorHandler = require('../../middleware/error.middleware');
const AppError = require('../../utils/AppError');

describe('Error Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleSpy;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/v1/test'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('AppError handling (AC #1)', () => {
    it('should return correct status and format for AppError', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Not found',
          details: null
        }
      });
    });

    it('should include details when provided in AppError', () => {
      const details = [{ field: 'email', message: 'Invalid format' }];
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details
        }
      });
    });

    it('should handle AppError with all status codes', () => {
      const testCases = [
        { status: 400, code: 'BAD_REQUEST' },
        { status: 401, code: 'UNAUTHORIZED' },
        { status: 403, code: 'FORBIDDEN' },
        { status: 404, code: 'NOT_FOUND' },
        { status: 409, code: 'CONFLICT' },
        { status: 429, code: 'RATE_LIMITED' }
      ];

      testCases.forEach(({ status, code }) => {
        mockRes.status.mockClear();
        mockRes.json.mockClear();

        const error = new AppError(`${code} message`, status, code);
        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(status);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code,
            message: `${code} message`,
            details: null
          }
        });
      });
    });
  });

  describe('Unknown error handling in production (AC #2)', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 500 status code for unknown errors', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive database error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should return generic message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive database credentials exposed');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null
        }
      });
    });

    it('should NOT expose stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database connection failed');

      errorHandler(error, mockReq, mockRes, mockNext);

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.error.stack).toBeUndefined();
      expect(jsonCall.error.message).toBe('Internal server error');
    });

    it('should hide error message when NODE_ENV is undefined (secure by default)', () => {
      delete process.env.NODE_ENV;
      const error = new Error('Sensitive database error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null
        }
      });
    });
  });

  describe('Unknown error handling in development (AC #3)', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 500 status code in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should include error message in response in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database connection failed',
          details: null
        }
      });
    });

    it('should log full stack trace to console in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toContainEqual(expect.stringContaining(error.stack));
    });
  });

  describe('Error logging (AC #5)', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should log timestamp, path, method, and error details', () => {
      process.env.NODE_ENV = 'development';
      const error = new AppError('Resource not found', 404, 'NOT_FOUND');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      const logString = JSON.stringify(logCall);

      // Verify structured log contains required fields
      expect(logString).toMatch(/timestamp/i);
      expect(logString).toMatch(/GET/);
      expect(logString).toMatch(/\/api\/v1\/test/);
      expect(logString).toMatch(/NOT_FOUND/);
    });

    it('should use structured log format', () => {
      process.env.NODE_ENV = 'development';
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];

      // First argument should be a tag, second should be structured data
      expect(logCall[0]).toBe('[ERROR]');
      expect(typeof logCall[1]).toBe('object');
      expect(logCall[1]).toHaveProperty('timestamp');
      expect(logCall[1]).toHaveProperty('method', 'GET');
      expect(logCall[1]).toHaveProperty('path', '/api/v1/test');
      expect(logCall[1]).toHaveProperty('error', 'Test error');
      expect(logCall[1]).toHaveProperty('code', 'TEST_ERROR');
    });

    it('should log stack trace only in development for unknown errors', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Unknown error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      // Stack should be in the log call
      expect(logCall.length).toBeGreaterThan(2);
    });

    it('should NOT log stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Unknown error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      // Stack should NOT be in the production log
      expect(logCall.length).toBe(2); // Only [ERROR] and logData object
    });
  });

  describe('Middleware signature (AC #6)', () => {
    it('should have 4-parameter signature (err, req, res, next)', () => {
      expect(errorHandler.length).toBe(4);
    });

    it('should not call next() after handling error', () => {
      const error = new AppError('Test', 400, 'TEST');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
