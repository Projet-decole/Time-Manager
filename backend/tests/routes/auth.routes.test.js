// backend/tests/routes/auth.routes.test.js

const request = require('supertest');
const app = require('../../app');

// Mock Supabase
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

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

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
      role: 'employee',
      weekly_hours_target: 35
    };

    it('should return 200 with user and session on valid credentials', async () => {
      // Mock successful auth
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      // Mock profile fetch
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

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('session');

      // Check user data
      expect(response.body.data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        weeklyHoursTarget: 35
      });

      // Check session data (camelCase)
      expect(response.body.data.session).toEqual({
        accessToken: mockSession.access_token,
        refreshToken: mockSession.refresh_token,
        expiresAt: mockSession.expires_at
      });
    });

    it('should return 401 on invalid credentials', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should return 400 with VALIDATION_ERROR when email is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' })
        ])
      );
    });

    it('should return 400 with VALIDATION_ERROR when password is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' })
        ])
      );
    });

    it('should return 400 with VALIDATION_ERROR when email format is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email format'
          })
        ])
      );
    });

    it('should return 400 with VALIDATION_ERROR when body is empty', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 when request body is JSON null', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('null');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // Express parses null as valid JSON but validator handles it
      expect(response.body.error).toHaveProperty('code');
    });

    it('should return 400 when password is empty string', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password is required'
          })
        ])
      );
    });

    it('should call supabase.auth.signInWithPassword with correct parameters', async () => {
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

      await request(app)
        .post('/api/v1/auth/login')
        .send(validCredentials);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validCredentials.email,
        password: validCredentials.password
      });
    });

    it('should fetch profile after successful authentication', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect
      });

      await request(app)
        .post('/api/v1/auth/login')
        .send(validCredentials);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('first_name, last_name, role, weekly_hours_target');
    });

    it('should return default values when profile fetch fails', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' }
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: null,
        lastName: null,
        role: 'employee',
        weeklyHoursTarget: 35
      });
    });
  });
});
