// backend/tests/middleware/error.middleware.test.js

const errorHandler = require('../../middleware/error.middleware');

describe('Error Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('Error Response Format', () => {
    it('should return standard error format with success: false', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      error.code = 'TEST_ERROR';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error'
        }
      });
    });

    it('should include details when provided', () => {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = [{ field: 'email', message: 'Invalid email' }];

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'email', message: 'Invalid email' }]
        }
      });
    });
  });

  describe('Default Values', () => {
    it('should default to 500 status code when not provided', () => {
      const error = new Error('Unknown error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should default to INTERNAL_SERVER_ERROR code when not provided', () => {
      const error = new Error('Unknown error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR'
          })
        })
      );
    });

    it('should default to generic message when not provided', () => {
      const error = {};

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'An unexpected error occurred'
          })
        })
      );
    });
  });

  describe('HTTP Status Codes', () => {
    const testCases = [
      { statusCode: 400, code: 'BAD_REQUEST' },
      { statusCode: 401, code: 'UNAUTHORIZED' },
      { statusCode: 403, code: 'FORBIDDEN' },
      { statusCode: 404, code: 'NOT_FOUND' },
      { statusCode: 409, code: 'CONFLICT' },
      { statusCode: 500, code: 'INTERNAL_SERVER_ERROR' }
    ];

    testCases.forEach(({ statusCode, code }) => {
      it(`should handle ${statusCode} ${code} errors`, () => {
        const error = new Error(`${code} error`);
        error.statusCode = statusCode;
        error.code = code;

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(statusCode);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code,
            message: `${code} error`
          }
        });
      });
    });
  });

  describe('Logging Behavior', () => {
    const originalEnv = process.env.NODE_ENV;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('should log errors in non-production environment', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Dev error');
      error.statusCode = 500;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log errors in production environment', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Prod error');
      error.statusCode = 500;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log 4xx errors (client errors are expected)', () => {
      process.env.NODE_ENV = 'development';
      consoleSpy.mockClear();

      const clientError = new Error('Client error');
      clientError.statusCode = 400;
      errorHandler(clientError, mockReq, mockRes, mockNext);

      // 4xx errors are expected client errors, no need to log
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
