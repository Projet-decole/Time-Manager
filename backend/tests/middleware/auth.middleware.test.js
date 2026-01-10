// backend/tests/middleware/auth.middleware.test.js

const { authenticate } = require('../../middleware/auth.middleware');
const AppError = require('../../utils/AppError');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next() when valid Bearer token is provided', () => {
      mockReq.headers.authorization = 'Bearer valid-token-123';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.accessToken).toBe('valid-token-123');
      expect(mockReq.user).toBeDefined();
    });

    it('should accept lowercase "bearer" scheme (RFC 7235 case-insensitive)', () => {
      mockReq.headers.authorization = 'bearer lowercase-token';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.accessToken).toBe('lowercase-token');
    });

    it('should accept uppercase "BEARER" scheme (RFC 7235 case-insensitive)', () => {
      mockReq.headers.authorization = 'BEARER UPPERCASE-TOKEN';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.accessToken).toBe('UPPERCASE-TOKEN');
    });

    it('should accept mixed case "BeArEr" scheme (RFC 7235 case-insensitive)', () => {
      mockReq.headers.authorization = 'BeArEr MixedCase-Token';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.accessToken).toBe('MixedCase-Token');
    });

    it('should set accessToken on request from Authorization header', () => {
      mockReq.headers.authorization = 'Bearer my-jwt-token';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.accessToken).toBe('my-jwt-token');
    });

    it('should set placeholder user on request', () => {
      mockReq.headers.authorization = 'Bearer test-token';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        id: 'placeholder-user-id',
        email: 'placeholder@example.com'
      });
    });

    it('should throw UNAUTHORIZED error when no Authorization header', () => {
      expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(AppError);

      try {
        authenticate(mockReq, mockRes, mockNext);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Authentication required');
      }
    });

    it('should throw UNAUTHORIZED error when Authorization header is empty', () => {
      mockReq.headers.authorization = '';

      expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(AppError);

      try {
        authenticate(mockReq, mockRes, mockNext);
      } catch (error) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should throw UNAUTHORIZED error when Authorization header does not start with Bearer', () => {
      mockReq.headers.authorization = 'Basic sometoken';

      expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(AppError);

      try {
        authenticate(mockReq, mockRes, mockNext);
      } catch (error) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Authentication required');
      }
    });

    it('should throw UNAUTHORIZED error when Bearer token is empty', () => {
      mockReq.headers.authorization = 'Bearer ';

      expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(AppError);

      try {
        authenticate(mockReq, mockRes, mockNext);
      } catch (error) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Invalid token format');
      }
    });

    it('should throw UNAUTHORIZED error when Bearer token is whitespace only', () => {
      mockReq.headers.authorization = 'Bearer    ';

      expect(() => authenticate(mockReq, mockRes, mockNext)).toThrow(AppError);

      try {
        authenticate(mockReq, mockRes, mockNext);
      } catch (error) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should not call next() when authentication fails', () => {
      try {
        authenticate(mockReq, mockRes, mockNext);
      } catch (error) {
        // Expected to throw
      }

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
