// backend/tests/routes/projects.routes.test.js

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

describe('Projects Routes', () => {
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

  const mockProjectId = '550e8400-e29b-41d4-a716-446655440100';

  const mockProjectDb = {
    id: mockProjectId,
    code: 'PRJ-001',
    name: 'Time Manager',
    description: 'Main project',
    budget_hours: 500,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  const mockProjectWithRelations = {
    ...mockProjectDb,
    time_entries: [{ duration_minutes: 120 }],
    team_projects: [
      {
        teams: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Engineering'
        }
      }
    ]
  };

  const mockProjectsList = [
    { ...mockProjectDb, time_entries: [{ duration_minutes: 120 }] },
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      code: 'PRJ-002',
      name: 'Marketing Site',
      description: 'Marketing project',
      budget_hours: 100,
      status: 'active',
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      time_entries: [{ duration_minutes: 60 }]
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
          }),
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockProjectsList,
              error: null,
              count: 2
            })
          })
        }),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockProjectsList,
            error: null,
            count: 2
          }),
          limit: jest.fn().mockResolvedValue({
            data: [{ code: 'PRJ-002' }],
            error: null
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockProjectDb, code: 'PRJ-003' },
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProjectDb,
              error: null
            })
          })
        })
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
          }),
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockProjectsList,
              error: null,
              count: 2
            })
          })
        }),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockProjectsList,
            error: null,
            count: 2
          })
        })
      })
    });
  };

  // ===========================================
  // GET /api/v1/projects - List Projects (AC2)
  // ===========================================
  describe('GET /api/v1/projects', () => {
    describe('AC2: List all active projects with pagination', () => {
      it('should return 200 with paginated project list for any authenticated user', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/projects')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('page');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('total');
        expect(response.body.meta.pagination).toHaveProperty('totalPages');
      });

      it('should return projects in camelCase format with totalHoursTracked', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/projects')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name', 'Time Manager');
        expect(response.body.data[0]).toHaveProperty('code', 'PRJ-001');
        expect(response.body.data[0]).toHaveProperty('budgetHours', 500);
        expect(response.body.data[0]).toHaveProperty('totalHoursTracked');
        expect(response.body.data[0]).toHaveProperty('createdAt');
        expect(response.body.data[0]).not.toHaveProperty('created_at');
        expect(response.body.data[0]).not.toHaveProperty('time_entries');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get('/api/v1/projects');

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
          .get('/api/v1/projects')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('AC2: Manager can filter with includeArchived', () => {
      it('should allow manager to include archived projects', async () => {
        const archivedProject = {
          ...mockProjectDb,
          id: '550e8400-e29b-41d4-a716-446655440102',
          status: 'archived',
          time_entries: []
        };

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
                data: [...mockProjectsList, archivedProject],
                error: null,
                count: 3
              })
            })
          })
        });

        const response = await request(app)
          .get('/api/v1/projects?includeArchived=true')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(3);
      });

      it('should ignore includeArchived for non-managers', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/projects?includeArchived=true')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        // Employee cannot see archived, so only active projects
        expect(response.body.data.every(p => p.status === 'active')).toBe(true);
      });
    });
  });

  // ===========================================
  // POST /api/v1/projects - Create Project (AC1)
  // ===========================================
  describe('POST /api/v1/projects', () => {
    describe('AC1: Create Project with auto-generated code', () => {
      it('should return 201 with created project data for manager', async () => {
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
          // Second call: generateNextCode
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ code: 'PRJ-002' }],
                    error: null
                  })
                })
              })
            };
          }
          // Third call: insert
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockProjectDb, code: 'PRJ-003' },
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Time Manager',
            description: 'Main project',
            budgetHours: 500
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('code');
        expect(response.body.data.code).toMatch(/^PRJ-\d{3,}$/);
        expect(response.body.data).toHaveProperty('name', 'Time Manager');
        expect(response.body.data).toHaveProperty('status', 'active');
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');
      });

      it('should create project without optional fields', async () => {
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
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
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
                  data: { ...mockProjectDb, description: null, budget_hours: null, code: 'PRJ-001' },
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Time Manager' });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Time Manager');
        expect(response.body.data).toHaveProperty('code', 'PRJ-001');
      });
    });

    describe('AC7: Authorization for Mutations', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer employee-token')
          .send({ name: 'New Project' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post('/api/v1/projects')
          .send({ name: 'New Project' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('Validation', () => {
      it('should return 400 when name is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer manager-token')
          .send({ description: 'Some description' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when name is empty', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Project name cannot be empty'
            })
          ])
        );
      });

      it('should return 400 when name exceeds 100 characters', async () => {
        setupManagerAuth();

        const longName = 'a'.repeat(101);
        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: longName });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Project name cannot exceed 100 characters'
            })
          ])
        );
      });

      it('should return 400 when description exceeds 500 characters', async () => {
        setupManagerAuth();

        const longDesc = 'a'.repeat(501);
        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Project', description: longDesc });

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

      it('should return 400 when budgetHours is negative', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Project', budgetHours: -10 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'budgetHours',
              message: 'Budget hours must be 0 or greater'
            })
          ])
        );
      });
    });
  });

  // ===========================================
  // GET /api/v1/projects/:id - Get Project Details (AC3)
  // ===========================================
  describe('GET /api/v1/projects/:id', () => {
    describe('AC3: Get Project Details', () => {
      it('should return 200 with project details including teams and hours for any authenticated user', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === 'id' && value === mockEmployeeProfile.id) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockEmployeeProfile,
                    error: null
                  })
                };
              }
              if (field === 'id' && value === mockProjectId) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockProjectWithRelations,
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
          .get(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockProjectId);
        expect(response.body.data).toHaveProperty('name', 'Time Manager');
        expect(response.body.data).toHaveProperty('code', 'PRJ-001');
        expect(response.body.data).toHaveProperty('teams');
        expect(response.body.data).toHaveProperty('totalHoursTracked');
        expect(Array.isArray(response.body.data.teams)).toBe(true);
      });

      it('should return teams in camelCase format', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === 'id' && value === mockEmployeeProfile.id) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockEmployeeProfile,
                    error: null
                  })
                };
              }
              if (field === 'id' && value === mockProjectId) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockProjectWithRelations,
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
          .get(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data.teams[0]).toHaveProperty('id');
        expect(response.body.data.teams[0]).toHaveProperty('name', 'Engineering');
      });

      it('should return 404 when project not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              if (field === 'id' && value === mockEmployeeProfile.id) {
                return {
                  single: jest.fn().mockResolvedValue({
                    data: mockEmployeeProfile,
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
          .get(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });
  });

  // ===========================================
  // PATCH /api/v1/projects/:id - Update Project (AC4)
  // ===========================================
  describe('PATCH /api/v1/projects/:id', () => {
    describe('AC4: Update Project', () => {
      it('should return 200 with updated project data for manager', async () => {
        const updatedProject = { ...mockProjectDb, name: 'Updated Time Manager' };

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
                  data: updatedProject,
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Updated Time Manager' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Updated Time Manager');
      });

      it('should return 404 when project not found', async () => {
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
          .patch(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Updated' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC7: Authorization for Mutations', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .patch(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ name: 'Updated' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .patch(`/api/v1/projects/${mockProjectId}`)
          .send({ name: 'Updated' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('Validation', () => {
      it('should return 400 when no data to update', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when name is empty', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/projects/${mockProjectId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });
  });

  // ===========================================
  // POST /api/v1/projects/:id/archive - Archive Project (AC5)
  // ===========================================
  describe('POST /api/v1/projects/:id/archive', () => {
    describe('AC5: Archive Project', () => {
      it('should return 200 with archived project for manager', async () => {
        const archivedProject = { ...mockProjectDb, status: 'archived' };

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
                  data: archivedProject,
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .post(`/api/v1/projects/${mockProjectId}/archive`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status', 'archived');
      });

      it('should return 404 when project not found', async () => {
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
          .post(`/api/v1/projects/${mockProjectId}/archive`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC7: Authorization for Mutations', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post(`/api/v1/projects/${mockProjectId}/archive`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post(`/api/v1/projects/${mockProjectId}/archive`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // POST /api/v1/projects/:id/restore - Restore Project (AC6)
  // ===========================================
  describe('POST /api/v1/projects/:id/restore', () => {
    describe('AC6: Restore Project', () => {
      it('should return 200 with restored project for manager', async () => {
        const restoredProject = { ...mockProjectDb, status: 'active' };

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
                  data: restoredProject,
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .post(`/api/v1/projects/${mockProjectId}/restore`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status', 'active');
      });

      it('should return 404 when project not found', async () => {
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
          .post(`/api/v1/projects/${mockProjectId}/restore`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC7: Authorization for Mutations', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post(`/api/v1/projects/${mockProjectId}/restore`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post(`/api/v1/projects/${mockProjectId}/restore`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // Story 3.4: Team-Project Assignment API Tests
  // GET /api/v1/projects?myTeams=true - Filter by user's teams (AC5)
  // ===========================================
  describe('GET /api/v1/projects?myTeams=true', () => {
    const mockTeamId = '550e8400-e29b-41d4-a716-446655440002';

    describe('AC5: Filter projects by user teams', () => {
      it('should return 200 with projects from user teams when myTeams=true', async () => {
        const mockMemberships = [{ team_id: mockTeamId }];
        const mockTeamProjects = [{ project_id: mockProjectId }];
        const mockUserTeamProjects = [
          { ...mockProjectDb, time_entries: [{ duration_minutes: 120 }] }
        ];

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
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
                    data: mockEmployeeProfile,
                    error: null
                  })
                })
              })
            };
          }
          // Second call: get user's team memberships
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockMemberships,
                  error: null
                })
              })
            };
          }
          // Third call: get team projects
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: mockTeamProjects,
                  error: null
                })
              })
            };
          }
          // Fourth call: get projects
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockUserTeamProjects,
                      error: null,
                      count: 1
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/projects?myTeams=true')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
      });

      it('should return empty list when user is not in any teams with myTeams=true', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
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
                    data: mockEmployeeProfile,
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/projects?myTeams=true')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual([]);
        expect(response.body.meta.pagination.total).toBe(0);
      });

      it('should return projects in camelCase format with totalHoursTracked', async () => {
        const mockMemberships = [{ team_id: mockTeamId }];
        const mockTeamProjects = [{ project_id: mockProjectId }];
        const mockUserTeamProjects = [
          { ...mockProjectDb, time_entries: [{ duration_minutes: 120 }] }
        ];

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
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
                    data: mockEmployeeProfile,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockMemberships,
                  error: null
                })
              })
            };
          }
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockResolvedValue({
                  data: mockTeamProjects,
                  error: null
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockUserTeamProjects,
                      error: null,
                      count: 1
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/projects?myTeams=true')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name', 'Time Manager');
        expect(response.body.data[0]).toHaveProperty('budgetHours', 500);
        expect(response.body.data[0]).toHaveProperty('totalHoursTracked');
        expect(response.body.data[0]).not.toHaveProperty('budget_hours');
        expect(response.body.data[0]).not.toHaveProperty('time_entries');
      });
    });
  });

  // ===========================================
  // UUID Validation Tests
  // ===========================================
  describe('UUID Validation', () => {
    it('should return 400 for invalid UUID on GET /projects/:id', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/projects/not-a-valid-uuid')
        .set('Authorization', 'Bearer employee-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_ID');
    });

    it('should return 400 for invalid UUID on PATCH /projects/:id', async () => {
      setupManagerAuth();

      const response = await request(app)
        .patch('/api/v1/projects/invalid-id')
        .set('Authorization', 'Bearer manager-token')
        .send({ name: 'Updated' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_ID');
    });

    it('should return 400 for invalid UUID on POST /projects/:id/archive', async () => {
      setupManagerAuth();

      const response = await request(app)
        .post('/api/v1/projects/123/archive')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_ID');
    });

    it('should return 400 for invalid UUID on POST /projects/:id/restore', async () => {
      setupManagerAuth();

      const response = await request(app)
        .post('/api/v1/projects/abc-def/restore')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_ID');
    });

    it('should accept valid UUID format', async () => {
      setupEmployeeAuth();

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((field, value) => {
            if (field === 'id' && value === mockEmployeeProfile.id) {
              return {
                single: jest.fn().mockResolvedValue({
                  data: mockEmployeeProfile,
                  error: null
                })
              };
            }
            if (field === 'id' && value === mockProjectId) {
              return {
                single: jest.fn().mockResolvedValue({
                  data: mockProjectWithRelations,
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
        .get(`/api/v1/projects/${mockProjectId}`)
        .set('Authorization', 'Bearer employee-token');

      // Should not return 400 for valid UUID
      expect(response.status).not.toBe(400);
    });
  });
});
