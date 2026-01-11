// backend/tests/routes/teams.routes.test.js

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
    },
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Teams Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockManagerUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'manager@example.com'
  };

  const mockEmployeeUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'employee@example.com'
  };

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

  const mockTeamId = '550e8400-e29b-41d4-a716-446655440100';

  const mockTeamDb = {
    id: mockTeamId,
    name: 'Engineering',
    description: 'Development team',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  const mockTeamWithRelations = {
    ...mockTeamDb,
    team_members: [
      {
        profiles: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'employee'
        }
      }
    ],
    team_projects: [
      {
        projects: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          code: 'PRJ-001',
          name: 'Time Manager'
        }
      }
    ]
  };

  const mockTeamsList = [
    { ...mockTeamDb, team_members: [{ count: 5 }] },
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      name: 'Marketing',
      description: 'Marketing team',
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      team_members: [{ count: 3 }]
    }
  ];

  // Helper to setup manager authentication
  const setupManagerAuth = () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockManagerUser },
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
            data: mockTeamsList,
            error: null,
            count: 2
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTeamDb,
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeamDb,
              error: null
            })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    });
  };

  // Helper to setup employee authentication
  const setupEmployeeAuth = () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockEmployeeUser },
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

  // ===========================================
  // GET /api/v1/teams - List Teams (AC2)
  // ===========================================
  describe('GET /api/v1/teams', () => {
    describe('AC2: List all teams with pagination', () => {
      it('should return 200 with paginated team list for manager', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/teams')
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

      it('should return teams in camelCase format with memberCount', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name', 'Engineering');
        expect(response.body.data[0]).toHaveProperty('memberCount', 5);
        expect(response.body.data[0]).toHaveProperty('createdAt');
        expect(response.body.data[0]).not.toHaveProperty('created_at');
        expect(response.body.data[0]).not.toHaveProperty('team_members');
      });

      it('should respect page and limit parameters', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        const mockRange = jest.fn().mockResolvedValue({
          data: [mockTeamsList[0]],
          error: null,
          count: 2
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
              range: mockRange
            })
          })
        });

        const response = await request(app)
          .get('/api/v1/teams?page=2&limit=1')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination.page).toBe(2);
        expect(response.body.meta.pagination.limit).toBe(1);
      });

      it('should use default pagination when params not provided', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination.page).toBe(1);
        expect(response.body.meta.pagination.limit).toBe(20);
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/teams')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get('/api/v1/teams');

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
          .get('/api/v1/teams')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // POST /api/v1/teams - Create Team (AC1)
  // ===========================================
  describe('POST /api/v1/teams', () => {
    describe('AC1: Create Team', () => {
      it('should return 201 with created team data for manager', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Engineering',
            description: 'Development team'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name', 'Engineering');
        expect(response.body.data).toHaveProperty('description', 'Development team');
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');
      });

      it('should create team without description', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Engineering' });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Engineering');
      });
    });

    describe('AC7: Validation', () => {
      it('should return 400 when name is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ description: 'Some description' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when name is empty', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Team name cannot be empty'
            })
          ])
        );
      });

      it('should return 400 when name exceeds 100 characters', async () => {
        setupManagerAuth();

        const longName = 'a'.repeat(101);
        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: longName });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Team name cannot exceed 100 characters'
            })
          ])
        );
      });

      it('should return 400 when description exceeds 500 characters', async () => {
        setupManagerAuth();

        const longDesc = 'a'.repeat(501);
        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Engineering', description: longDesc });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: 'Description cannot exceed 500 characters'
            })
          ])
        );
      });

      it('should allow name at exactly 100 characters', async () => {
        setupManagerAuth();

        const exactName = 'a'.repeat(100);
        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: exactName });

        expect(response.status).toBe(201);
      });

      it('should return 400 when name is only whitespace', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: '   ' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Team name cannot be empty'
            })
          ])
        );
      });
    });

    describe('Duplicate Name Handling', () => {
      it('should return 409 when team name already exists', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
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
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key value' }
              })
            })
          })
        });

        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Engineering' });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'DUPLICATE_NAME');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/teams')
          .set('Authorization', 'Bearer employee-token')
          .send({ name: 'Engineering' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post('/api/v1/teams')
          .send({ name: 'Engineering' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // GET /api/v1/teams/:id - Get Team Details (AC3)
  // ===========================================
  describe('GET /api/v1/teams/:id', () => {
    describe('AC3: Get Team Details', () => {
      it('should return 200 with team details including members and projects', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === 'id' && value === mockManagerProfile.id) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                };
              }
              if (field === 'id' && value === mockTeamId) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockTeamWithRelations,
                    error: null
                  })
                };
              }
              return {
                single: jest.fn().mockResolvedValue({ data: null, error: null })
              };
            })
          })
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockTeamId);
        expect(response.body.data).toHaveProperty('name', 'Engineering');
        expect(response.body.data).toHaveProperty('description', 'Development team');
        expect(response.body.data).toHaveProperty('members');
        expect(response.body.data).toHaveProperty('projects');
        expect(Array.isArray(response.body.data.members)).toBe(true);
        expect(Array.isArray(response.body.data.projects)).toBe(true);
      });

      it('should return members in camelCase format', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === 'id' && value === mockManagerProfile.id) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                };
              }
              if (field === 'id' && value === mockTeamId) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockTeamWithRelations,
                    error: null
                  })
                };
              }
              return {
                single: jest.fn().mockResolvedValue({ data: null, error: null })
              };
            })
          })
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.data.members[0]).toHaveProperty('firstName', 'John');
        expect(response.body.data.members[0]).toHaveProperty('lastName', 'Doe');
        expect(response.body.data.members[0]).not.toHaveProperty('first_name');
        expect(response.body.data.members[0]).not.toHaveProperty('last_name');
      });

      it('should return 404 when team not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === 'id' && value === mockManagerProfile.id) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                };
              }
              return {
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              };
            })
          })
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('Input Validation', () => {
      it('should return 400 for invalid UUID format in id parameter', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/teams/invalid-uuid')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'INVALID_ID');
      });

      it('should return 400 for SQL injection attempt in id parameter', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/teams/1; DROP TABLE teams;--')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'INVALID_ID');
      });
    });
  });

  // ===========================================
  // PATCH /api/v1/teams/:id - Update Team (AC4)
  // ===========================================
  describe('PATCH /api/v1/teams/:id', () => {
    describe('AC4: Update Team', () => {
      it('should return 200 with updated team data for manager', async () => {
        const updatedTeam = { ...mockTeamDb, name: 'Updated Engineering' };

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
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
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedTeam,
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Updated Engineering' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Updated Engineering');
      });

      it('should allow updating description only', async () => {
        const updatedTeam = { ...mockTeamDb, description: 'New description' };

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
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
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedTeam,
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ description: 'New description' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('description', 'New description');
      });

      it('should return 404 when team not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
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
          }),
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
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Updated' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC7: Validation', () => {
      it('should return 400 when name is empty', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when name exceeds 100 characters', async () => {
        setupManagerAuth();

        const longName = 'a'.repeat(101);
        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: longName });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when description exceeds 500 characters', async () => {
        setupManagerAuth();

        const longDesc = 'a'.repeat(501);
        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ description: longDesc });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when no data to update', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when only invalid fields are provided', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ invalidField: 'value', anotherInvalid: 123 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ name: 'Updated' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .patch(`/api/v1/teams/${mockTeamId}`)
          .send({ name: 'Updated' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // DELETE /api/v1/teams/:id - Delete Team (AC5)
  // ===========================================
  describe('DELETE /api/v1/teams/:id', () => {
    describe('AC5: Delete Team', () => {
      it('should return 200 with success message for manager', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call is for auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call is for existence check
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          // Third call is for delete
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('message', 'Team deleted successfully');
      });

      it('should return 404 when team not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call is for auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call is for existence check - team not found
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // Story 3.2: Team Member Assignment API Tests
  // ===========================================

  const mockUserId = '550e8400-e29b-41d4-a716-446655440002';
  const mockMembershipId = '550e8400-e29b-41d4-a716-446655440200';

  const mockMembershipDb = {
    id: mockMembershipId,
    team_id: mockTeamId,
    user_id: mockUserId,
    created_at: '2026-01-10T10:00:00.000Z',
    profiles: {
      id: mockUserId,
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'employee'
    }
  };

  // ===========================================
  // GET /api/v1/teams/:teamId/members - List Team Members (AC4)
  // ===========================================
  describe('GET /api/v1/teams/:teamId/members', () => {
    describe('AC4: List Team Members', () => {
      it('should return 200 with paginated members list for manager', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call: auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call: check if team exists
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          // Third call: get members
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: [mockMembershipDb],
                    error: null,
                    count: 1
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('page');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('total');
      });

      it('should return members in camelCase format with user data', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: [mockMembershipDb],
                    error: null,
                    count: 1
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('userId');
        expect(response.body.data[0]).toHaveProperty('teamId');
        expect(response.body.data[0]).toHaveProperty('createdAt');
        expect(response.body.data[0]).toHaveProperty('user');
        expect(response.body.data[0].user).toHaveProperty('firstName', 'John');
        expect(response.body.data[0].user).not.toHaveProperty('first_name');
      });

      it('should return 404 when team not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/members`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // POST /api/v1/teams/:teamId/members - Add Member to Team (AC1)
  // ===========================================
  describe('POST /api/v1/teams/:teamId/members', () => {
    describe('AC1: Add Member to Team', () => {
      it('should return 201 with membership data for manager', async () => {
        const mockInsertedMembership = {
          id: mockMembershipId,
          team_id: mockTeamId,
          user_id: mockUserId,
          created_at: '2026-01-10T10:00:00.000Z'
        };

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call: auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call: check if team exists
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          // Third call: check if user exists
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockUserId },
                    error: null
                  })
                })
              })
            };
          }
          // Fourth call: insert membership
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockInsertedMembership,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token')
          .send({ userId: mockUserId });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('teamId', mockTeamId);
        expect(response.body.data).toHaveProperty('userId', mockUserId);
        expect(response.body.data).toHaveProperty('createdAt');
      });
    });

    describe('AC2: Prevent Duplicate Assignment', () => {
      it('should return 400 with ALREADY_MEMBER for duplicate', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockUserId },
                    error: null
                  })
                })
              })
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23505', message: 'duplicate key value' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token')
          .send({ userId: mockUserId });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'ALREADY_MEMBER');
      });
    });

    describe('AC7: Non-existent References', () => {
      it('should return 404 when team not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token')
          .send({ userId: mockUserId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'TEAM_NOT_FOUND');
      });

      it('should return 404 when user not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token')
          .send({ userId: mockUserId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
      });
    });

    describe('Validation', () => {
      it('should return 400 when userId is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when userId is invalid UUID', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer manager-token')
          .send({ userId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .set('Authorization', 'Bearer employee-token')
          .send({ userId: mockUserId });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/members`)
          .send({ userId: mockUserId });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // DELETE /api/v1/teams/:teamId/members/:userId - Remove Member (AC3)
  // ===========================================
  describe('DELETE /api/v1/teams/:teamId/members/:userId', () => {
    describe('AC3: Remove Member from Team', () => {
      it('should return 200 with success message for manager', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call: auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call: check if membership exists
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mockMembershipId },
                      error: null
                    })
                  })
                })
              })
            };
          }
          // Third call: delete membership
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/members/${mockUserId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('message', 'Member removed successfully');
      });

      it('should return 404 when member not in team', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Not found' }
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/members/${mockUserId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_MEMBER');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/members/${mockUserId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/members/${mockUserId}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // Story 3.4: Team-Project Assignment API Tests
  // ===========================================

  const mockProjectId = '550e8400-e29b-41d4-a716-446655440003';
  const mockAssignmentId = '550e8400-e29b-41d4-a716-446655440200';

  const mockAssignmentDb = {
    id: mockAssignmentId,
    team_id: mockTeamId,
    project_id: mockProjectId,
    created_at: '2026-01-10T10:00:00.000Z',
    projects: {
      id: mockProjectId,
      code: 'PRJ-001',
      name: 'Time Manager',
      description: 'Main project',
      budget_hours: 500,
      status: 'active'
    }
  };

  // ===========================================
  // GET /api/v1/teams/:teamId/projects - List Team Projects (AC4)
  // ===========================================
  describe('GET /api/v1/teams/:teamId/projects', () => {
    describe('AC4: List Team Projects', () => {
      it('should return 200 with paginated projects list for manager', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call: auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call: check if team exists
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          // Third call: get projects
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: [mockAssignmentDb],
                    error: null,
                    count: 1
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('page');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('total');
      });

      it('should return projects in camelCase format with project data', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: [mockAssignmentDb],
                    error: null,
                    count: 1
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('teamId');
        expect(response.body.data[0]).toHaveProperty('projectId');
        expect(response.body.data[0]).toHaveProperty('createdAt');
        expect(response.body.data[0]).toHaveProperty('project');
        expect(response.body.data[0].project).toHaveProperty('budgetHours', 500);
        expect(response.body.data[0].project).not.toHaveProperty('budget_hours');
      });

      it('should return 404 when team not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get(`/api/v1/teams/${mockTeamId}/projects`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // POST /api/v1/teams/:teamId/projects - Assign Project to Team (AC1)
  // ===========================================
  describe('POST /api/v1/teams/:teamId/projects', () => {
    describe('AC1: Assign Project to Team', () => {
      it('should return 201 with assignment data for manager', async () => {
        const mockInsertedAssignment = {
          id: mockAssignmentId,
          team_id: mockTeamId,
          project_id: mockProjectId,
          created_at: '2026-01-10T10:00:00.000Z'
        };

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call: auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call: check if team exists
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          // Third call: check if project exists
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockProjectId },
                    error: null
                  })
                })
              })
            };
          }
          // Fourth call: insert assignment
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockInsertedAssignment,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token')
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('teamId', mockTeamId);
        expect(response.body.data).toHaveProperty('projectId', mockProjectId);
        expect(response.body.data).toHaveProperty('createdAt');
      });
    });

    describe('AC2: Prevent Duplicate Assignment', () => {
      it('should return 400 with ALREADY_ASSIGNED for duplicate', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockProjectId },
                    error: null
                  })
                })
              })
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23505', message: 'duplicate key value' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token')
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'ALREADY_ASSIGNED');
      });
    });

    describe('Non-existent References', () => {
      it('should return 404 when team not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token')
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'TEAM_NOT_FOUND');
      });

      it('should return 404 when project not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: mockTeamId },
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token')
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'PROJECT_NOT_FOUND');
      });
    });

    describe('Validation', () => {
      it('should return 400 when projectId is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when projectId is invalid UUID', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer manager-token')
          .send({ projectId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .set('Authorization', 'Bearer employee-token')
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post(`/api/v1/teams/${mockTeamId}/projects`)
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // DELETE /api/v1/teams/:teamId/projects/:projectId - Unassign Project (AC3)
  // ===========================================
  describe('DELETE /api/v1/teams/:teamId/projects/:projectId', () => {
    describe('AC3: Unassign Project from Team', () => {
      it('should return 200 with success message for manager', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // First call: auth middleware profile fetch
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call: check if assignment exists
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: mockAssignmentId },
                      error: null
                    })
                  })
                })
              })
            };
          }
          // Third call: delete assignment
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('message', 'Project unassigned successfully');
      });

      it('should return 404 when project not assigned to team', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockManagerUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockManagerProfile,
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Not found' }
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_ASSIGNED');
      });
    });

    describe('AC6: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .delete(`/api/v1/teams/${mockTeamId}/projects/${mockProjectId}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });
});
