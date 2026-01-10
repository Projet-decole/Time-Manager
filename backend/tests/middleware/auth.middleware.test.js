// backend/tests/middleware/auth.middleware.test.js

const AppError = require('../../utils/AppError');

// Mock Supabase before requiring the middleware
jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

const { authenticate } = require('../../middleware/auth.middleware');
const { supabase } = require('../../utils/supabase');

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

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    describe('AC#1: Valid token populates req.user', () => {
      it('should populate req.user with id, email, and role when token is valid', async () => {
        mockReq.headers.authorization = 'Bearer valid-token-123';

        // Mock Supabase auth.getUser success
        supabase.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: 'user-uuid-123',
              email: 'test@example.com'
            }
          },
          error: null
        });

        // Mock profile query
        const mockSingle = jest.fn().mockResolvedValue({
          data: {
            first_name: 'John',
            last_name: 'Doe',
            role: 'employee',
            weekly_hours_target: 35
          },
          error: null
        });
        const mockEq = jest.fn(() => ({ single: mockSingle }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        supabase.from.mockReturnValue({ select: mockSelect });

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.user).toEqual({
          id: 'user-uuid-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'employee',
          weeklyHoursTarget: 35
        });
      });

      it('should set accessToken on request for logout endpoint', async () => {
        mockReq.headers.authorization = 'Bearer my-jwt-token';

        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        });

        const mockSingle = jest.fn().mockResolvedValue({
          data: { role: 'employee' },
          error: null
        });
        const mockEq = jest.fn(() => ({ single: mockSingle }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        supabase.from.mockReturnValue({ select: mockSelect });

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockReq.accessToken).toBe('my-jwt-token');
      });

      it('should proceed to next handler after successful authentication', async () => {
        mockReq.headers.authorization = 'Bearer valid-token';

        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        });

        const mockSingle = jest.fn().mockResolvedValue({
          data: { role: 'manager' },
          error: null
        });
        const mockEq = jest.fn(() => ({ single: mockSingle }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        supabase.from.mockReturnValue({ select: mockSelect });

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.user.id).toBe('user-123');
        expect(mockReq.user.email).toBe('test@example.com');
        expect(mockReq.user.role).toBe('manager');
      });

      it('should handle profile not found gracefully', async () => {
        mockReq.headers.authorization = 'Bearer valid-token';

        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        });

        // Profile not found
        const mockSingle = jest.fn().mockResolvedValue({
          data: null,
          error: null
        });
        const mockEq = jest.fn(() => ({ single: mockSingle }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        supabase.from.mockReturnValue({ select: mockSelect });

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.user.id).toBe('user-123');
        expect(mockReq.user.email).toBe('test@example.com');
      });

      it('should log warning and continue when profile query fails with error', async () => {
        mockReq.headers.authorization = 'Bearer valid-token';
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-456', email: 'test@example.com' } },
          error: null
        });

        // Profile query fails with network error
        const mockSingle = jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' }
        });
        const mockEq = jest.fn(() => ({ single: mockSingle }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        supabase.from.mockReturnValue({ select: mockSelect });

        await authenticate(mockReq, mockRes, mockNext);

        // Should still proceed (auth succeeded)
        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.user.id).toBe('user-456');
        expect(mockReq.user.email).toBe('test@example.com');

        // Should log warning about profile fetch failure
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[AUTH] Profile fetch failed for user:',
          'user-456',
          'Network error'
        );

        consoleWarnSpy.mockRestore();
      });
    });

    describe('AC#2: Missing Authorization header returns 401', () => {
      it('should return 401 when no Authorization header is present', async () => {
        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      });

      it('should return error format matching AC#2 spec', async () => {
        await authenticate(mockReq, mockRes, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error.message).toBeDefined();
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.statusCode).toBe(401);
      });
    });

    describe('AC#3: Invalid or expired token returns 401', () => {
      it('should return 401 when Supabase returns error for invalid token', async () => {
        mockReq.headers.authorization = 'Bearer invalid-token';

        supabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' }
        });

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      });

      it('should return 401 when Supabase returns null user', async () => {
        mockReq.headers.authorization = 'Bearer expired-token';

        supabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null
        });

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toContain('Invalid');
      });

      it('should return 401 when token is expired', async () => {
        mockReq.headers.authorization = 'Bearer expired-jwt-token';

        supabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'JWT expired' }
        });

        await authenticate(mockReq, mockRes, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      });
    });

    describe('AC#4: Malformed Authorization header returns 401', () => {
      it('should return 401 with "Invalid authorization format" for non-Bearer scheme', async () => {
        mockReq.headers.authorization = 'Basic sometoken';

        await authenticate(mockReq, mockRes, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid authorization format');
      });

      it('should return 401 for empty Authorization header', async () => {
        mockReq.headers.authorization = '';

        await authenticate(mockReq, mockRes, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error.statusCode).toBe(401);
      });

      it('should return 401 for Bearer without token', async () => {
        mockReq.headers.authorization = 'Bearer ';

        await authenticate(mockReq, mockRes, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      });

      it('should return 401 for Bearer with only whitespace', async () => {
        mockReq.headers.authorization = 'Bearer    ';

        await authenticate(mockReq, mockRes, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error.statusCode).toBe(401);
      });

      it('should return 401 for malformed "Bearertoken" without space', async () => {
        mockReq.headers.authorization = 'Bearertoken123';

        await authenticate(mockReq, mockRes, mockNext);

        const error = mockNext.mock.calls[0][0];
        expect(error.statusCode).toBe(401);
      });
    });

    describe('RFC 7235 Case-Insensitive Bearer Scheme', () => {
      beforeEach(() => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        });

        const mockSingle = jest.fn().mockResolvedValue({
          data: { role: 'employee' },
          error: null
        });
        const mockEq = jest.fn(() => ({ single: mockSingle }));
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        supabase.from.mockReturnValue({ select: mockSelect });
      });

      it('should accept lowercase "bearer" scheme', async () => {
        mockReq.headers.authorization = 'bearer lowercase-token';

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.accessToken).toBe('lowercase-token');
      });

      it('should accept uppercase "BEARER" scheme', async () => {
        mockReq.headers.authorization = 'BEARER UPPERCASE-TOKEN';

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.accessToken).toBe('UPPERCASE-TOKEN');
      });

      it('should accept mixed case "BeArEr" scheme', async () => {
        mockReq.headers.authorization = 'BeArEr MixedCase-Token';

        await authenticate(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.accessToken).toBe('MixedCase-Token');
      });
    });
  });
});
