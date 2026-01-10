// backend/tests/utils/AppError.test.js

const AppError = require('../../utils/AppError');

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with all required properties', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND');

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeNull();
    });

    it('should extend the native Error class', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have a proper stack trace', () => {
      const error = new AppError('Stack test', 400, 'STACK_TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('should handle details parameter', () => {
      const details = [{ field: 'email', message: 'Invalid email format' }];
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

      expect(error.details).toEqual(details);
      expect(error.details).toHaveLength(1);
      expect(error.details[0].field).toBe('email');
    });

    it('should handle empty details array', () => {
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', []);

      expect(error.details).toEqual([]);
    });

    it('should handle null details explicitly', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND', null);

      expect(error.details).toBeNull();
    });
  });

  describe('error properties', () => {
    it('should support 400 Bad Request errors', () => {
      const error = new AppError('Bad request', 400, 'BAD_REQUEST');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });

    it('should support 401 Unauthorized errors', () => {
      const error = new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should support 403 Forbidden errors', () => {
      const error = new AppError('Forbidden', 403, 'FORBIDDEN');

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should support 404 Not Found errors', () => {
      const error = new AppError('Resource not found', 404, 'NOT_FOUND');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should support 500 Internal Server errors', () => {
      const error = new AppError('Internal error', 500, 'INTERNAL_ERROR');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should support complex details with multiple fields', () => {
      const details = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
        { field: 'username', message: 'Username already exists' }
      ];
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

      expect(error.details).toHaveLength(3);
      expect(error.details[0].field).toBe('email');
      expect(error.details[1].field).toBe('password');
      expect(error.details[2].field).toBe('username');
    });
  });

  describe('isOperational flag', () => {
    it('should always have isOperational set to true', () => {
      const error1 = new AppError('Error 1', 400, 'CODE_1');
      const error2 = new AppError('Error 2', 500, 'CODE_2');
      const error3 = new AppError('Error 3', 404, 'CODE_3', [{ field: 'test' }]);

      expect(error1.isOperational).toBe(true);
      expect(error2.isOperational).toBe(true);
      expect(error3.isOperational).toBe(true);
    });
  });

  describe('error name', () => {
    it('should have name property from Error class', () => {
      const error = new AppError('Test', 400, 'TEST');

      expect(error.name).toBe('Error');
    });
  });
});
