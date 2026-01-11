// backend/tests/utils/validation.test.js

const { z } = require('zod');
const { validate, validateUUID } = require('../../utils/validation');
const AppError = require('../../utils/AppError');

describe('Validation Utility', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z.number().min(0, 'Age must be positive').optional()
  });

  describe('validate middleware', () => {
    it('should call next() when validation passes', () => {
      mockReq.body = { name: 'John', age: 25 };

      const middleware = validate(testSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody).toEqual({ name: 'John', age: 25 });
    });

    it('should return 400 with validation errors when validation fails', () => {
      mockReq.body = { name: '', age: 25 };

      const middleware = validate(testSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Name is required'
            })
          ])
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined body', () => {
      mockReq.body = undefined;

      const middleware = validate(testSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null body', () => {
      mockReq.body = null;

      const middleware = validate(testSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass through optional fields correctly', () => {
      mockReq.body = { name: 'John' };

      const middleware = validate(testSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody).toEqual({ name: 'John' });
    });

    it('should strip unknown fields', () => {
      mockReq.body = { name: 'John', unknownField: 'value' };

      const middleware = validate(testSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Zod strips unknown fields by default
      expect(mockReq.validatedBody).toEqual({ name: 'John' });
    });
  });

  describe('validateUUID middleware', () => {
    beforeEach(() => {
      mockReq = { params: {} };
      mockNext = jest.fn();
    });

    it('should call next() when UUID is valid', () => {
      mockReq.params.id = '550e8400-e29b-41d4-a716-446655440000';

      const middleware = validateUUID('id');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with AppError when UUID is invalid', () => {
      mockReq.params.id = 'invalid-uuid';

      const middleware = validateUUID('id');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_ID');
    });

    it('should call next with AppError when UUID is missing', () => {
      mockReq.params = {};

      const middleware = validateUUID('id');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with AppError for SQL injection attempt', () => {
      mockReq.params.id = '1; DROP TABLE users;--';

      const middleware = validateUUID('id');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.code).toBe('INVALID_ID');
    });

    it('should use custom param name', () => {
      mockReq.params.teamId = 'invalid';

      const middleware = validateUUID('teamId');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('teamId');
    });

    it('should accept valid UUID v4 format', () => {
      // Valid UUID v4
      mockReq.params.id = '123e4567-e89b-12d3-a456-426614174000';

      const middleware = validateUUID('id');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
