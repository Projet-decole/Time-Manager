// backend/tests/services/auth.service.test.js

// Mock Supabase before importing service
jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn()
    },
    from: jest.fn()
  },
  supabaseAdmin: null,
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');
const authService = require('../../services/auth.service');
const AppError = require('../../utils/AppError');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com'
    };

    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: 1736512800
    };

    const mockProfile = {
      first_name: 'John',
      last_name: 'Doe',
      role: 'manager',
      weekly_hours_target: 40
    };

    it('should return user and session data on successful login', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
    });

    it('should transform user data to camelCase', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'manager',
        weeklyHoursTarget: 40
      });
    });

    it('should transform session data to camelCase', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.session).toEqual({
        accessToken: mockSession.access_token,
        refreshToken: mockSession.refresh_token,
        expiresAt: mockSession.expires_at
      });
    });

    it('should throw AppError with INVALID_CREDENTIALS on auth failure', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects
        .toThrow(AppError);

      try {
        await authService.login('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should return default values when profile is not found', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' }
            })
          })
        })
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: null,
        lastName: null,
        role: 'employee',
        weeklyHoursTarget: 35
      });
    });

    it('should call supabase.auth.signInWithPassword with correct email and password', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      });

      await authService.login('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should query profiles table with user id after successful auth', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq
        })
      });

      await authService.login('test@example.com', 'password123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id);
    });

    it('should handle profile query rejection gracefully', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      // When profile query throws, it will propagate the error
      // This is expected behavior - unhandled database errors should propagate
      await expect(authService.login('test@example.com', 'password123'))
        .rejects
        .toThrow('Database error');
    });
  });
});
