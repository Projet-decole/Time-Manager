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
        signOut: jest.fn(),
        createUser: jest.fn(),
        generateLink: jest.fn(),
        deleteUser: jest.fn()
      }
    },
    from: jest.fn()
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

  describe('GET /api/v1/users (Manager Only)', () => {
    const mockManagerProfile = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'manager@example.com',
      first_name: 'Manager',
      last_name: 'User',
      role: 'manager',
      weekly_hours_target: 40,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    };

    const mockEmployeeProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'employee@example.com',
      first_name: 'Employee',
      last_name: 'User',
      role: 'employee',
      weekly_hours_target: 35,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    };

    const mockUsersList = [
      mockEmployeeProfile,
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'employee',
        weekly_hours_target: 35,
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z'
      },
      mockManagerProfile
    ];

    const setupManagerAuth = () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockManagerProfile.id, email: mockManagerProfile.email } },
        error: null
      });

      // This mock handles both auth middleware profile fetch and getAllUsers
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockManagerProfile,
              error: null
            })
          }),
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockUsersList,
              error: null,
              count: 3
            })
          })
        })
      });
    };

    const setupEmployeeAuth = () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockEmployeeProfile.id, email: mockEmployeeProfile.email } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployeeProfile,
              error: null
            })
          })
        })
      });
    };

    describe('AC#1: Manager gets paginated list of all users', () => {
      it('should return 200 with paginated user list for manager', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('page');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('total');
        expect(response.body.meta.pagination).toHaveProperty('totalPages');
      });

      it('should return users in camelCase format', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('firstName');
        expect(response.body.data[0]).toHaveProperty('lastName');
        expect(response.body.data[0]).toHaveProperty('weeklyHoursTarget');
        expect(response.body.data[0]).toHaveProperty('createdAt');
        // Should NOT have snake_case
        expect(response.body.data[0]).not.toHaveProperty('first_name');
        expect(response.body.data[0]).not.toHaveProperty('last_name');
      });
    });

    describe('AC#2: Pagination and filtering', () => {
      it('should respect page and limit parameters', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: mockManagerProfile.id, email: mockManagerProfile.email } },
          error: null
        });

        const mockRange = jest.fn().mockResolvedValue({
          data: [mockUsersList[0]],
          error: null,
          count: 3
        });

        const mockOrder = jest.fn().mockReturnValue({
          range: mockRange
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockManagerProfile,
                error: null
              })
            }),
            order: mockOrder
          })
        });

        const response = await request(app)
          .get('/api/v1/users?page=2&limit=1')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination.page).toBe(2);
        expect(response.body.meta.pagination.limit).toBe(1);
      });

      it('should filter users by role when role query param is provided', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: mockManagerProfile.id, email: mockManagerProfile.email } },
          error: null
        });

        const employeesOnly = mockUsersList.filter(u => u.role === 'employee');

        const mockRange = jest.fn().mockResolvedValue({
          data: employeesOnly,
          error: null,
          count: 2
        });

        const mockOrder = jest.fn().mockReturnValue({
          range: mockRange
        });

        const mockEq = jest.fn().mockReturnValue({
          order: mockOrder
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === 'id') {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                };
              }
              if (field === 'role') {
                return {
                  order: mockOrder
                };
              }
              return { single: jest.fn() };
            }),
            order: mockOrder
          })
        });

        const response = await request(app)
          .get('/api/v1/users?role=employee')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.data.every(u => u.role === 'employee')).toBe(true);
      });
    });

    describe('AC#3: Employee access forbidden', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });
    });

    describe('AC#4: Unauthenticated access', () => {
      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get('/api/v1/users');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });

      it('should return 401 with invalid token', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' }
        });

        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('Query validation', () => {
      it('should use default pagination when params not provided', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination.page).toBe(1);
        expect(response.body.meta.pagination.limit).toBe(20);
      });

      it('should cap limit at 100', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: mockManagerProfile.id, email: mockManagerProfile.email } },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockManagerProfile,
                error: null
              })
            }),
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockUsersList,
                error: null,
                count: 3
              })
            })
          })
        });

        const response = await request(app)
          .get('/api/v1/users?limit=500')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination.limit).toBe(100);
      });

      it('should ignore invalid role filter values', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: { id: mockManagerProfile.id, email: mockManagerProfile.email } },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockManagerProfile,
                error: null
              })
            }),
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockUsersList,
                error: null,
                count: 3
              })
            })
          })
        });

        const response = await request(app)
          .get('/api/v1/users?role=invalid_role')
          .set('Authorization', 'Bearer manager-token');

        // Should still return 200, just ignore invalid filter
        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================================
  // Story 2.14: Manager User Management Tests
  // ============================================================

  describe('POST /api/v1/users (Manager Create User)', () => {
    const mockManagerProfile = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'manager@example.com',
      first_name: 'Manager',
      last_name: 'User',
      role: 'manager',
      weekly_hours_target: 40,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    };

    const mockEmployeeProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'employee@example.com',
      first_name: 'Employee',
      last_name: 'User',
      role: 'employee',
      weekly_hours_target: 35,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    };

    const setupManagerAuth = () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockManagerProfile.id, email: mockManagerProfile.email } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockManagerProfile,
              error: null
            })
          })
        })
      });
    };

    const setupEmployeeAuth = () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockEmployeeProfile.id, email: mockEmployeeProfile.email } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployeeProfile,
              error: null
            })
          })
        })
      });
    };

    describe('AC#1: Manager can create new user', () => {
      it('should return 201 with created user data for manager (AC#1, AC#2)', async () => {
        setupManagerAuth();

        const newUserId = '550e8400-e29b-41d4-a716-446655440099';
        const { supabaseAdmin } = require('../../utils/supabase');

        supabaseAdmin.auth.admin.createUser = jest.fn().mockResolvedValue({
          data: { user: { id: newUserId, email: 'newuser@example.com' } },
          error: null
        });

        supabaseAdmin.auth.admin.generateLink = jest.fn().mockResolvedValue({
          data: { properties: { action_link: 'https://example.com/reset' } },
          error: null
        });

        supabaseAdmin.from = jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: newUserId,
                  email: 'newuser@example.com',
                  first_name: 'Jean',
                  last_name: 'Dupont',
                  role: 'employee',
                  weekly_hours_target: 40
                },
                error: null
              })
            })
          })
        });

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean',
            lastName: 'Dupont',
            role: 'employee',
            weeklyHoursTarget: 40
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', newUserId);
        expect(response.body.data).toHaveProperty('email', 'newuser@example.com');
        expect(response.body.data).toHaveProperty('firstName', 'Jean');
        expect(response.body.data).toHaveProperty('lastName', 'Dupont');
        expect(response.body.data).toHaveProperty('role', 'employee');
        expect(response.body.data).toHaveProperty('weeklyHoursTarget', 40);
      });

      it('should use default values for role and weeklyHoursTarget', async () => {
        setupManagerAuth();

        const newUserId = '550e8400-e29b-41d4-a716-446655440099';
        const { supabaseAdmin } = require('../../utils/supabase');

        supabaseAdmin.auth.admin.createUser = jest.fn().mockResolvedValue({
          data: { user: { id: newUserId, email: 'newuser@example.com' } },
          error: null
        });

        supabaseAdmin.auth.admin.generateLink = jest.fn().mockResolvedValue({
          data: { properties: { action_link: 'https://example.com/reset' } },
          error: null
        });

        supabaseAdmin.from = jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: newUserId,
                  email: 'newuser@example.com',
                  first_name: 'Jean',
                  last_name: 'Dupont',
                  role: 'employee',
                  weekly_hours_target: 35
                },
                error: null
              })
            })
          })
        });

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean',
            lastName: 'Dupont'
          });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('role', 'employee');
        expect(response.body.data).toHaveProperty('weeklyHoursTarget', 35);
      });
    });

    describe('AC#6: Validation errors', () => {
      it('should return 400 when email is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            firstName: 'Jean',
            lastName: 'Dupont'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when firstName is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'newuser@example.com',
            lastName: 'Dupont'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when lastName is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when email is invalid format', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'not-an-email',
            firstName: 'Jean',
            lastName: 'Dupont'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when role is invalid', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean',
            lastName: 'Dupont',
            role: 'admin'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when weeklyHoursTarget > 168', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean',
            lastName: 'Dupont',
            weeklyHoursTarget: 200
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when weeklyHoursTarget < 0', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean',
            lastName: 'Dupont',
            weeklyHoursTarget: -5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 409 when email already exists', async () => {
        setupManagerAuth();

        const { supabaseAdmin } = require('../../utils/supabase');

        supabaseAdmin.auth.admin.createUser = jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User already registered' }
        });

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer manager-token')
          .send({
            email: 'existing@example.com',
            firstName: 'Jean',
            lastName: 'Dupont'
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'EMAIL_EXISTS');
      });
    });

    describe('Authorization', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', 'Bearer employee-token')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean',
            lastName: 'Dupont'
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post('/api/v1/users')
          .send({
            email: 'newuser@example.com',
            firstName: 'Jean',
            lastName: 'Dupont'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  describe('PATCH /api/v1/users/:id (Manager Update User)', () => {
    const mockManagerProfile = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'manager@example.com',
      first_name: 'Manager',
      last_name: 'User',
      role: 'manager',
      weekly_hours_target: 40,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    };

    const mockEmployeeProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'employee@example.com',
      first_name: 'Employee',
      last_name: 'User',
      role: 'employee',
      weekly_hours_target: 35,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    };

    const targetUserId = '550e8400-e29b-41d4-a716-446655440099';

    const setupManagerAuth = () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockManagerProfile.id, email: mockManagerProfile.email } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockManagerProfile,
              error: null
            })
          })
        })
      });
    };

    const setupEmployeeAuth = () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockEmployeeProfile.id, email: mockEmployeeProfile.email } },
        error: null
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployeeProfile,
              error: null
            })
          })
        })
      });
    };

    describe('AC#3: Manager can edit user weeklyHoursTarget', () => {
      it('should return 200 with updated user data for manager', async () => {
        setupManagerAuth();

        const { supabaseAdmin } = require('../../utils/supabase');

        supabaseAdmin.from = jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: targetUserId,
                    email: 'target@example.com',
                    first_name: 'Target',
                    last_name: 'User',
                    role: 'employee',
                    weekly_hours_target: 40
                  },
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ weeklyHoursTarget: 40 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('weeklyHoursTarget', 40);
      });

      it('should allow updating firstName and lastName', async () => {
        setupManagerAuth();

        const { supabaseAdmin } = require('../../utils/supabase');

        supabaseAdmin.from = jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: targetUserId,
                    email: 'target@example.com',
                    first_name: 'NewFirst',
                    last_name: 'NewLast',
                    role: 'employee',
                    weekly_hours_target: 35
                  },
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ firstName: 'NewFirst', lastName: 'NewLast' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('firstName', 'NewFirst');
        expect(response.body.data).toHaveProperty('lastName', 'NewLast');
      });
    });

    describe('Validation', () => {
      it('should return 400 when weeklyHoursTarget > 168', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ weeklyHoursTarget: 200 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when weeklyHoursTarget < 0', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ weeklyHoursTarget: -5 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when no data to update', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 404 when user not found', async () => {
        setupManagerAuth();

        const { supabaseAdmin } = require('../../utils/supabase');

        supabaseAdmin.from = jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116', message: 'No rows found' }
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ weeklyHoursTarget: 40 });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('Authorization', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ weeklyHoursTarget: 40 });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .patch(`/api/v1/users/${targetUserId}`)
          .send({ weeklyHoursTarget: 40 });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });
});
