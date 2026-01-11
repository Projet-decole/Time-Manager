// backend/tests/utils/validation.test.js

const { z } = require('zod');
const { validate } = require('../../utils/validation');

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
});
