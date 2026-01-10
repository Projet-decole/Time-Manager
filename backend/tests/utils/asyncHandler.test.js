// backend/tests/utils/asyncHandler.test.js

const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('Error propagation (AC #4)', () => {
    it('should pass errors to next() when async function rejects', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should pass errors to next() when async function throws', async () => {
      const error = new Error('Thrown async error');
      const asyncFn = jest.fn().mockImplementation(async () => {
        throw error;
      });

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call next() when async function succeeds', async () => {
      const asyncFn = jest.fn().mockResolvedValue();

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not call next() when sync function in promise succeeds', async () => {
      const asyncFn = jest.fn().mockImplementation((req, res) => {
        res.json({ success: true });
        return Promise.resolve();
      });

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Handler execution', () => {
    it('should call the wrapped function with req, res, next', async () => {
      const asyncFn = jest.fn().mockResolvedValue();

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should return a function', () => {
      const asyncFn = jest.fn();
      const handler = asyncHandler(asyncFn);

      expect(typeof handler).toBe('function');
    });

    it('should handle functions that return values', async () => {
      const asyncFn = jest.fn().mockResolvedValue('result');

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Application stability (AC #4)', () => {
    it('should not crash the application when error occurs', async () => {
      const error = new Error('Critical error');
      const asyncFn = jest.fn().mockRejectedValue(error);

      const handler = asyncHandler(asyncFn);

      // This should not throw - handler catches and passes to next()
      await handler(mockReq, mockRes, mockNext);

      // Error was caught and passed to next, not thrown
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should properly propagate different error types', async () => {
      const typeError = new TypeError('Type error');
      const asyncFn = jest.fn().mockRejectedValue(typeError);

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(typeError);
    });
  });
});
