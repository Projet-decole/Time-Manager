// backend/tests/routes/users.routes.test.js

const request = require('supertest');
const app = require('../../app');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  },
  supabaseAdmin: {
    auth: {
      admin: {
        signOut: jest.fn()
      }
    }
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuthUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com'
  };

  const mockProfile = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'employee',
    weekly_hours_target: 35,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  // Helper to setup successful authentication mocks
  const setupAuthMocks = (profile = mockProfile) => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null
    });

    // Mock for auth middleware profile fetch
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: profile,
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profile,
              error: null
            })
          })
        })
      })
    });
  };

  describe('GET /api/v1/users/me', () => {
    it('should return 200 with user profile on valid auth (AC #1)', async () => {
      setupAuthMocks();

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: mockProfile.id,
        email: mockProfile.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        weeklyHoursTarget: 35,
        createdAt: mockProfile.created_at,
        updatedAt: mockProfile.updated_at
      });
    });

    it('should return 401 without Authorization header (AC #4)', async () => {
      const response = await request(app)
        .get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return 401 with invalid token (AC #4)', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return 404 when profile not found', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should return 200 with updated profile (AC #2)', async () => {
      const updatedProfile = {
        ...mockProfile,
        first_name: 'Jane',
        last_name: 'Smith',
        weekly_hours_target: 40
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      // Mock for both auth middleware and service calls
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane', lastName: 'Smith', weeklyHoursTarget: 40 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('firstName', 'Jane');
      expect(response.body.data).toHaveProperty('lastName', 'Smith');
      expect(response.body.data).toHaveProperty('weeklyHoursTarget', 40);
    });

    it('should not allow email change via this endpoint (AC #2)', async () => {
      const updatedProfile = { ...mockProfile };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ email: 'hacker@evil.com', firstName: 'John' });

      expect(response.status).toBe(200);
      // Email should NOT be changed
      expect(response.body.data.email).toBe(mockProfile.email);
    });

    it('should not allow role change via this endpoint (AC #2)', async () => {
      const updatedProfile = { ...mockProfile };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ role: 'admin', firstName: 'John' });

      expect(response.status).toBe(200);
      // Role should NOT be changed
      expect(response.body.data.role).toBe('employee');
    });

    it('should return 400 with empty firstName (AC #3)', async () => {
      setupAuthMocks();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'firstName',
            message: 'First name cannot be empty'
          })
        ])
      );
    });

    it('should return 400 when weeklyHoursTarget > 168 (AC #3)', async () => {
      setupAuthMocks();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ weeklyHoursTarget: 200 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'weeklyHoursTarget',
            message: 'Weekly hours target cannot exceed 168'
          })
        ])
      );
    });

    it('should return 400 when weeklyHoursTarget < 0 (AC #3)', async () => {
      setupAuthMocks();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ weeklyHoursTarget: -5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'weeklyHoursTarget',
            message: 'Weekly hours target must be at least 0'
          })
        ])
      );
    });

    it('should return 400 when weeklyHoursTarget is not a number (AC #3)', async () => {
      setupAuthMocks();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ weeklyHoursTarget: 'forty' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'weeklyHoursTarget'
          })
        ])
      );
    });

    it('should return 401 without Authorization header (AC #4)', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should allow partial update with only firstName', async () => {
      const updatedProfile = {
        ...mockProfile,
        first_name: 'Jane'
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('firstName', 'Jane');
    });

    it('should allow weeklyHoursTarget of 0', async () => {
      const updatedProfile = {
        ...mockProfile,
        weekly_hours_target: 0
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ weeklyHoursTarget: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('weeklyHoursTarget', 0);
    });

    it('should allow weeklyHoursTarget of 168 (max hours in week)', async () => {
      const updatedProfile = {
        ...mockProfile,
        weekly_hours_target: 168
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ weeklyHoursTarget: 168 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('weeklyHoursTarget', 168);
    });

    it('should return 400 when firstName exceeds 100 characters', async () => {
      setupAuthMocks();

      const longName = 'a'.repeat(101);
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: longName });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'firstName',
            message: 'First name cannot exceed 100 characters'
          })
        ])
      );
    });

    it('should return 400 when lastName exceeds 100 characters', async () => {
      setupAuthMocks();

      const longName = 'b'.repeat(101);
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ lastName: longName });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'lastName',
            message: 'Last name cannot exceed 100 characters'
          })
        ])
      );
    });

    it('should return current profile when body is empty object', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
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

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: mockProfile.id,
        email: mockProfile.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        weeklyHoursTarget: 35,
        createdAt: mockProfile.created_at,
        updatedAt: mockProfile.updated_at
      });
    });

    it('should allow firstName at exactly 100 characters', async () => {
      const exactName = 'a'.repeat(100);
      const updatedProfile = {
        ...mockProfile,
        first_name: exactName
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: exactName });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
