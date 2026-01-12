// backend/tests/routes/time-entries.routes.test.js

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

describe('Time Entries Routes', () => {
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

  const mockEntryId = '550e8400-e29b-41d4-a716-446655440100';
  const mockProjectId = '550e8400-e29b-41d4-a716-446655440200';
  const mockCategoryId = '550e8400-e29b-41d4-a716-446655440300';

  const mockTimeEntryDb = {
    id: mockEntryId,
    user_id: mockEmployeeProfile.id,
    project_id: mockProjectId,
    category_id: mockCategoryId,
    start_time: '2026-01-12T09:00:00.000Z',
    end_time: '2026-01-12T12:30:00.000Z',
    duration_minutes: 210,
    description: 'Working on feature X',
    entry_mode: 'simple',
    created_at: '2026-01-12T09:00:05.000Z',
    updated_at: '2026-01-12T09:00:05.000Z',
    projects: {
      id: mockProjectId,
      code: 'PRJ-001',
      name: 'Time Manager'
    },
    categories: {
      id: mockCategoryId,
      name: 'Development',
      color: '#3B82F6'
    }
  };

  const mockTimeEntriesList = [
    mockTimeEntryDb,
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      user_id: mockEmployeeProfile.id,
      project_id: null,
      category_id: null,
      start_time: '2026-01-12T14:00:00.000Z',
      end_time: null,
      duration_minutes: null,
      description: 'Afternoon work',
      entry_mode: 'simple',
      created_at: '2026-01-12T14:00:00.000Z',
      updated_at: '2026-01-12T14:00:00.000Z',
      projects: null,
      categories: null
    }
  ];

  // Helper to setup employee authentication
  const setupEmployeeAuth = () => {
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
          if (field === 'user_id') {
            return {
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockTimeEntriesList,
                  error: null,
                  count: 2
                })
              }),
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: mockTimeEntriesList,
                      error: null,
                      count: 2
                    })
                  })
                })
              }),
              single: jest.fn().mockResolvedValue({
                data: mockTimeEntryDb,
                error: null
              })
            };
          }
          return {
            single: jest.fn().mockResolvedValue({
              data: mockTimeEntryDb,
              error: null
            }),
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          };
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTimeEntryDb,
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTimeEntryDb,
              error: null
            })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      })
    });
  };

  // Helper to setup manager authentication
  const setupManagerAuth = () => {
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
          if (field === 'user_id') {
            return {
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockTimeEntriesList,
                  error: null,
                  count: 2
                })
              }),
              single: jest.fn().mockResolvedValue({
                data: mockTimeEntryDb,
                error: null
              })
            };
          }
          return {
            single: jest.fn().mockResolvedValue({
              data: mockTimeEntryDb,
              error: null
            }),
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          };
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTimeEntryDb,
            error: null
          })
        })
      })
    });
  };

  // ===========================================
  // Authentication Tests
  // ===========================================
  describe('Authentication Tests', () => {
    it('GET /time-entries without auth returns 401', async () => {
      const response = await request(app)
        .get('/api/v1/time-entries');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('POST /time-entries without auth returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/time-entries')
        .send({
          startTime: '2026-01-12T09:00:00.000Z',
          entryMode: 'simple'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('PATCH /time-entries/:id without auth returns 401', async () => {
      const response = await request(app)
        .patch(`/api/v1/time-entries/${mockEntryId}`)
        .send({ description: 'Updated' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('DELETE /time-entries/:id without auth returns 401', async () => {
      const response = await request(app)
        .delete(`/api/v1/time-entries/${mockEntryId}`);

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
        .get('/api/v1/time-entries')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // ===========================================
  // GET /api/v1/time-entries - List Time Entries (AC2, AC6)
  // ===========================================
  describe('GET /api/v1/time-entries', () => {
    describe('AC2: List own time entries with pagination', () => {
      it('should return 200 with paginated time entry list for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/time-entries')
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

      it('should return entries in camelCase format', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('userId');
        expect(response.body.data[0]).toHaveProperty('startTime');
        expect(response.body.data[0]).toHaveProperty('durationMinutes');
        expect(response.body.data[0]).toHaveProperty('entryMode');
        expect(response.body.data[0]).toHaveProperty('createdAt');
        expect(response.body.data[0]).not.toHaveProperty('user_id');
        expect(response.body.data[0]).not.toHaveProperty('start_time');
      });

      it('should include project and category data', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('project');
        expect(response.body.data[0].project).toHaveProperty('name', 'Time Manager');
        expect(response.body.data[0]).toHaveProperty('category');
        expect(response.body.data[0].category).toHaveProperty('color', '#3B82F6');
      });

      it('should support date range filters', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/time-entries?startDate=2026-01-12&endDate=2026-01-12')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should respect page and limit parameters', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        const mockRange = jest.fn().mockResolvedValue({
          data: [mockTimeEntriesList[0]],
          error: null,
          count: 2
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
                order: jest.fn().mockReturnValue({
                  range: mockRange
                })
              };
            })
          })
        });

        const response = await request(app)
          .get('/api/v1/time-entries?page=2&limit=1')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination.page).toBe(2);
        expect(response.body.meta.pagination.limit).toBe(1);
      });
    });

    describe('AC6: Manager can view other users entries', () => {
      it('should allow manager to view employee entries with userId filter', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get(`/api/v1/time-entries?userId=${mockEmployeeProfile.id}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return manager own entries without userId filter', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/time-entries')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  // ===========================================
  // POST /api/v1/time-entries - Create Time Entry (AC1)
  // ===========================================
  describe('POST /api/v1/time-entries', () => {
    describe('AC1: Create Time Entry', () => {
      it('should return 201 with created time entry for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            endTime: '2026-01-12T12:30:00.000Z',
            projectId: mockProjectId,
            categoryId: mockCategoryId,
            description: 'Working on feature X',
            entryMode: 'simple'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('startTime');
        expect(response.body.data).toHaveProperty('durationMinutes');
        expect(response.body.data).toHaveProperty('entryMode', 'simple');
      });

      it('should create entry with minimal fields', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            entryMode: 'simple'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should accept day entry mode', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            entryMode: 'day'
          });

        expect(response.status).toBe(201);
      });

      it('should accept template entry mode', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            entryMode: 'template'
          });

        expect(response.status).toBe(201);
      });
    });

    describe('AC7: Validation Rules', () => {
      it('should return 400 when startTime is missing', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            entryMode: 'simple'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when entryMode is missing', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when entryMode is invalid', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            entryMode: 'invalid'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when startTime is invalid', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: 'not-a-date',
            entryMode: 'simple'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when endTime is before startTime', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T12:00:00.000Z',
            endTime: '2026-01-12T09:00:00.000Z',
            entryMode: 'simple'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'endTime',
              message: 'End time must be after start time'
            })
          ])
        );
      });

      it('should return 400 when projectId is invalid UUID', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            projectId: 'not-a-uuid',
            entryMode: 'simple'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when categoryId is invalid UUID', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            categoryId: 'not-a-uuid',
            entryMode: 'simple'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when description exceeds 500 characters', async () => {
        setupEmployeeAuth();

        const longDescription = 'a'.repeat(501);
        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            description: longDescription,
            entryMode: 'simple'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should accept description at exactly 500 characters', async () => {
        setupEmployeeAuth();

        const exactDescription = 'a'.repeat(500);
        const response = await request(app)
          .post('/api/v1/time-entries')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            description: exactDescription,
            entryMode: 'simple'
          });

        expect(response.status).toBe(201);
      });
    });
  });

  // ===========================================
  // GET /api/v1/time-entries/:id - Get Time Entry Details (AC3)
  // ===========================================
  describe('GET /api/v1/time-entries/:id', () => {
    describe('AC3: Get Time Entry by ID', () => {
      it('should return 200 with time entry details for owner', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockEntryId);
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('startTime');
        expect(response.body.data).toHaveProperty('project');
        expect(response.body.data).toHaveProperty('category');
      });

      it('should return 404 when entry not found', async () => {
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
          .get(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });

      it('should return 403 when employee tries to view other user entry', async () => {
        const otherUserEntry = {
          ...mockTimeEntryDb,
          user_id: 'different-user-id'
        };

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
                  data: otherUserEntry,
                  error: null
                })
              };
            })
          })
        });

        const response = await request(app)
          .get(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should allow manager to view any user entry', async () => {
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
                  data: mockTimeEntryDb,
                  error: null
                })
              };
            })
          })
        });

        const response = await request(app)
          .get(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  // ===========================================
  // PATCH /api/v1/time-entries/:id - Update Time Entry (AC4)
  // ===========================================
  describe('PATCH /api/v1/time-entries/:id', () => {
    describe('AC4: Update Time Entry', () => {
      it('should return 200 with updated time entry', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: mockEntryId,
                      user_id: mockEmployeeProfile.id,
                      start_time: '2026-01-12T09:00:00.000Z',
                      end_time: '2026-01-12T12:00:00.000Z'
                    },
                    error: null
                  })
                })
              })
            };
          }
          // Check timesheet
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null,
                      error: null
                    })
                  })
                })
              })
            };
          }
          // Update entry
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      ...mockTimeEntryDb,
                      description: 'Updated description',
                      projects: undefined,
                      categories: undefined
                    },
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Updated description' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return 400 when no data provided', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .patch(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 403 when timesheet is submitted', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: mockEntryId,
                      user_id: mockEmployeeProfile.id,
                      start_time: '2026-01-12T09:00:00.000Z',
                      end_time: '2026-01-12T12:00:00.000Z'
                    },
                    error: null
                  })
                })
              })
            };
          }
          // Check timesheet - submitted
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'ts-id', status: 'submitted' },
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Updated description' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'TIMESHEET_LOCKED');
        expect(response.body.error.message).toContain('submitted/validated timesheet');
      });

      it('should return 403 when timesheet is validated', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: mockEntryId,
                      user_id: mockEmployeeProfile.id,
                      start_time: '2026-01-12T09:00:00.000Z',
                      end_time: '2026-01-12T12:00:00.000Z'
                    },
                    error: null
                  })
                })
              })
            };
          }
          // Check timesheet - validated
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'ts-id', status: 'validated' },
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Updated description' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'TIMESHEET_LOCKED');
      });
    });
  });

  // ===========================================
  // DELETE /api/v1/time-entries/:id - Delete Time Entry (AC5)
  // ===========================================
  describe('DELETE /api/v1/time-entries/:id', () => {
    describe('AC5: Delete Time Entry', () => {
      it('should return 200 with success message', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: mockEntryId,
                      user_id: mockEmployeeProfile.id,
                      start_time: '2026-01-12T09:00:00.000Z'
                    },
                    error: null
                  })
                })
              })
            };
          }
          // Check timesheet
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null,
                      error: null
                    })
                  })
                })
              })
            };
          }
          // Delete entry
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('message', 'Time entry deleted successfully');
      });

      it('should return 404 when entry not found', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry - not found
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
          .delete(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });

      it('should return 403 when employee tries to delete other user entry', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry - different user
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: mockEntryId,
                    user_id: 'different-user-id',
                    start_time: '2026-01-12T09:00:00.000Z'
                  },
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 403 when timesheet is submitted', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: mockEntryId,
                      user_id: mockEmployeeProfile.id,
                      start_time: '2026-01-12T09:00:00.000Z'
                    },
                    error: null
                  })
                })
              })
            };
          }
          // Check timesheet - submitted
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'ts-id', status: 'submitted' },
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'TIMESHEET_LOCKED');
        expect(response.body.error.message).toContain('submitted/validated timesheet');
      });

      it('should return 403 when timesheet is validated', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Fetch existing entry
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: mockEntryId,
                      user_id: mockEmployeeProfile.id,
                      start_time: '2026-01-12T09:00:00.000Z'
                    },
                    error: null
                  })
                })
              })
            };
          }
          // Check timesheet - validated
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'ts-id', status: 'validated' },
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/time-entries/${mockEntryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'TIMESHEET_LOCKED');
      });
    });
  });

  // ===========================================
  // POST /api/v1/time-entries/start - Start Timer (Story 4.2)
  // ===========================================
  describe('POST /api/v1/time-entries/start', () => {
    describe('AC1: Start Timer Successfully', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .send({});

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });

      it('should return 201 and create timer successfully', async () => {
        const mockCreatedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: new Date().toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // Check active timer
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          // Insert entry
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedEntry,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('startTime');
        expect(response.body.data).toHaveProperty('endTime', null);
        expect(response.body.data).toHaveProperty('durationMinutes', null);
        expect(response.body.data).toHaveProperty('entryMode', 'simple');
      });

      it('should create timer with projectId successfully', async () => {
        const mockCreatedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: mockProjectId,
          category_id: null,
          start_time: new Date().toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedEntry,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('projectId', mockProjectId);
      });

      it('should create timer with categoryId successfully', async () => {
        const mockCreatedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: mockCategoryId,
          start_time: new Date().toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedEntry,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ categoryId: mockCategoryId });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('categoryId', mockCategoryId);
      });

      it('should create timer with description successfully', async () => {
        const mockCreatedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: new Date().toISOString(),
          end_time: null,
          duration_minutes: null,
          description: 'Working on feature X',
          entry_mode: 'simple',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedEntry,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Working on feature X' });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('description', 'Working on feature X');
      });
    });

    describe('AC2: Timer Already Running', () => {
      it('should return 400 when timer already running', async () => {
        const activeTimer = {
          id: 'existing-timer-id',
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: '2026-01-12T09:00:00.000Z',
          updated_at: '2026-01-12T09:00:00.000Z',
          projects: null,
          categories: null
        };

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
          // Active timer exists
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: activeTimer,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'TIMER_ALREADY_RUNNING');
        expect(response.body.error).toHaveProperty('message', 'Timer already running');
        expect(response.body.error).toHaveProperty('data');
        expect(response.body.error.data).toHaveProperty('id', 'existing-timer-id');
      });
    });

    describe('AC5: Validation Rules', () => {
      it('should return 400 when projectId is invalid UUID', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ projectId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when categoryId is invalid UUID', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ categoryId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when description exceeds 500 characters', async () => {
        setupEmployeeAuth();

        const longDescription = 'a'.repeat(501);
        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ description: longDescription });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when projectId is non-existent', async () => {
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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
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
                  error: { code: '23503', message: 'project_id foreign key violation' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ projectId: '550e8400-e29b-41d4-a716-446655440999' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'INVALID_PROJECT_ID');
      });

      it('should return 400 when categoryId is non-existent', async () => {
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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
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
                  error: { code: '23503', message: 'category_id foreign key violation' }
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ categoryId: '550e8400-e29b-41d4-a716-446655440999' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'INVALID_CATEGORY_ID');
      });
    });
  });

  // ===========================================
  // GET /api/v1/time-entries/active - Get Active Timer (Story 4.2)
  // ===========================================
  describe('GET /api/v1/time-entries/active', () => {
    describe('AC3: Get Active Timer', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .get('/api/v1/time-entries/active');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });

      it('should return null when no active timer exists', async () => {
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
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/active')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeNull();
      });

      it('should return active timer when exists', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: null,
          duration_minutes: null,
          description: 'Working on feature X',
          entry_mode: 'simple',
          created_at: '2026-01-12T09:00:00.000Z',
          updated_at: '2026-01-12T09:00:00.000Z',
          projects: {
            id: mockProjectId,
            code: 'PRJ-001',
            name: 'Time Manager'
          },
          categories: {
            id: mockCategoryId,
            name: 'Development',
            color: '#3B82F6'
          }
        };

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
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: activeTimer,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/active')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).not.toBeNull();
        expect(response.body.data).toHaveProperty('id', mockEntryId);
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('startTime', '2026-01-12T09:00:00.000Z');
        expect(response.body.data).toHaveProperty('endTime', null);
        expect(response.body.data).toHaveProperty('entryMode', 'simple');
      });

      it('should include project details when available', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: mockProjectId,
          category_id: null,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: '2026-01-12T09:00:00.000Z',
          updated_at: '2026-01-12T09:00:00.000Z',
          projects: {
            id: mockProjectId,
            code: 'PRJ-001',
            name: 'Time Manager'
          },
          categories: null
        };

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
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: activeTimer,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/active')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('project');
        expect(response.body.data.project).toHaveProperty('name', 'Time Manager');
        expect(response.body.data.project).toHaveProperty('code', 'PRJ-001');
      });

      it('should include category details when available', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: mockCategoryId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: '2026-01-12T09:00:00.000Z',
          updated_at: '2026-01-12T09:00:00.000Z',
          projects: null,
          categories: {
            id: mockCategoryId,
            name: 'Development',
            color: '#3B82F6'
          }
        };

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
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: activeTimer,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/active')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('category');
        expect(response.body.data.category).toHaveProperty('name', 'Development');
        expect(response.body.data.category).toHaveProperty('color', '#3B82F6');
      });
    });
  });

  // ===========================================
  // POST /api/v1/time-entries/stop - Stop Timer (Story 4.3)
  // ===========================================
  describe('POST /api/v1/time-entries/stop', () => {
    const startTime = new Date(Date.now() - 3600000); // 1 hour ago

    describe('AC1: Stop Timer Successfully', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .send({});

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });

      it('should return 200 and stop timer successfully', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString(),
          projects: null,
          categories: null
        };

        const stoppedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: 60,
          description: null,
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: activeTimer,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: stoppedEntry,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockEntryId);
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('startTime');
        expect(response.body.data).toHaveProperty('endTime');
        expect(response.body.data.endTime).not.toBeNull();
        expect(response.body.data).toHaveProperty('durationMinutes', 60);
        expect(response.body.data).toHaveProperty('entryMode', 'simple');
      });

      it('should include all required fields in response', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          start_time: startTime.toISOString(),
          end_time: null,
          duration_minutes: null,
          description: 'Working',
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString(),
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        };

        const stoppedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          start_time: startTime.toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: 60,
          description: 'Working',
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: activeTimer,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: stoppedEntry,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('startTime');
        expect(response.body.data).toHaveProperty('endTime');
        expect(response.body.data).toHaveProperty('durationMinutes');
        expect(response.body.data).toHaveProperty('projectId');
        expect(response.body.data).toHaveProperty('categoryId');
        expect(response.body.data).toHaveProperty('description');
        expect(response.body.data).toHaveProperty('entryMode');
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');
      });
    });

    describe('AC2: No Active Timer', () => {
      it('should return 404 when no active timer exists', async () => {
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
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NO_ACTIVE_TIMER');
        expect(response.body.error).toHaveProperty('message', 'No active timer found');
      });
    });

    describe('AC3: Stop Timer with Optional Details', () => {
      it('should update projectId when provided', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString(),
          projects: null,
          categories: null
        };

        const stoppedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: mockProjectId,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: 60,
          description: null,
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: activeTimer,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: stoppedEntry,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({ projectId: mockProjectId });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('projectId', mockProjectId);
      });

      it('should update description when provided', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString(),
          projects: null,
          categories: null
        };

        const stoppedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: 60,
          description: 'Completed feature implementation',
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: activeTimer,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: stoppedEntry,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Completed feature implementation' });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('description', 'Completed feature implementation');
      });

      it('should return 400 with invalid projectId', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString(),
          projects: null,
          categories: null
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: activeTimer,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: null,
                          error: { code: '23503', message: 'project_id foreign key violation' }
                        })
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({ projectId: '550e8400-e29b-41d4-a716-446655440999' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'INVALID_PROJECT_ID');
      });

      it('should return 400 with invalid categoryId', async () => {
        const activeTimer = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: startTime.toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'simple',
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString(),
          projects: null,
          categories: null
        };

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
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: activeTimer,
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: null,
                          error: { code: '23503', message: 'category_id foreign key violation' }
                        })
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({ categoryId: '550e8400-e29b-41d4-a716-446655440999' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'INVALID_CATEGORY_ID');
      });
    });

    describe('AC4: Validation Rules', () => {
      it('should return 400 when projectId is invalid UUID', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({ projectId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when categoryId is invalid UUID', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({ categoryId: 'not-a-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when description exceeds 500 characters', async () => {
        setupEmployeeAuth();

        const longDescription = 'a'.repeat(501);
        const response = await request(app)
          .post('/api/v1/time-entries/stop')
          .set('Authorization', 'Bearer employee-token')
          .send({ description: longDescription });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle entry with null endTime (running timer)', async () => {
      const runningEntry = {
        ...mockTimeEntryDb,
        end_time: null,
        duration_minutes: null
      };

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
                data: runningEntry,
                error: null
              })
            };
          })
        })
      });

      const response = await request(app)
        .get(`/api/v1/time-entries/${mockEntryId}`)
        .set('Authorization', 'Bearer employee-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('endTime', null);
      expect(response.body.data).toHaveProperty('durationMinutes', null);
    });
  });

  // ===========================================
  // Day Mode Routes (Story 4.5)
  // ===========================================

  describe('POST /api/v1/time-entries/day/start', () => {
    describe('Authentication', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .post('/api/v1/time-entries/day/start')
          .send({});

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('AC1: Start Day Successfully', () => {
      it('should create day entry and return 201', async () => {
        const mockCreatedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: new Date().toISOString(),
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'day',
          parent_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      is: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                          data: null,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedEntry,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/day/start')
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('userId');
        expect(response.body.data).toHaveProperty('startTime');
        expect(response.body.data).toHaveProperty('endTime', null);
        expect(response.body.data).toHaveProperty('durationMinutes', null);
        expect(response.body.data).toHaveProperty('entryMode', 'day');
        expect(response.body.data).toHaveProperty('parentId', null);
      });

      it('should create day with description', async () => {
        const mockCreatedEntry = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: new Date().toISOString(),
          end_time: null,
          duration_minutes: null,
          description: 'Working from home',
          entry_mode: 'day',
          parent_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      is: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                          data: null,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            };
          }
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedEntry,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/day/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Working from home' });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('description', 'Working from home');
      });
    });

    describe('AC2: Prevent Multiple Active Days', () => {
      it('should return 400 when day already active', async () => {
        const activeDay = {
          id: 'existing-day-id',
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: null,
          duration_minutes: null,
          description: null,
          entry_mode: 'day',
          parent_id: null,
          created_at: '2026-01-12T08:00:00.000Z',
          updated_at: '2026-01-12T08:00:00.000Z'
        };

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
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: activeDay,
                        error: null
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/day/start')
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'DAY_ALREADY_ACTIVE');
        expect(response.body.error).toHaveProperty('message', 'A day is already in progress');
        expect(response.body.error).toHaveProperty('data');
        expect(response.body.error.data).toHaveProperty('id', 'existing-day-id');
      });
    });

    describe('AC8: Validation Rules', () => {
      it('should return 400 when description exceeds 500 characters', async () => {
        setupEmployeeAuth();

        const longDescription = 'a'.repeat(501);
        const response = await request(app)
          .post('/api/v1/time-entries/day/start')
          .set('Authorization', 'Bearer employee-token')
          .send({ description: longDescription });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });
  });

  describe('POST /api/v1/time-entries/day/end', () => {
    const dayStartTime = new Date(Date.now() - 8 * 3600000); // 8 hours ago

    describe('Authentication', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .post('/api/v1/time-entries/day/end');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('AC3: End Day Successfully', () => {
      it('should end day and return 200 with blocks', async () => {
        const activeDay = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: dayStartTime.toISOString(),
          end_time: null,
          duration_minutes: null,
          description: 'Working from home',
          entry_mode: 'day',
          parent_id: null,
          created_at: dayStartTime.toISOString(),
          updated_at: dayStartTime.toISOString()
        };

        const endedDay = {
          ...activeDay,
          end_time: new Date().toISOString(),
          duration_minutes: 480,
          updated_at: new Date().toISOString()
        };

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
          // getActiveDay
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      is: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                          data: activeDay,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            };
          }
          // update day
          if (callCount === 3) {
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        error: null
                      })
                    })
                  })
                })
              })
            };
          }
          // getDayWithBlocks - get day
          if (callCount === 4) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: endedDay,
                    error: null
                  })
                })
              })
            };
          }
          // getDayWithBlocks - get blocks
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/day/end')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockEntryId);
        expect(response.body.data).toHaveProperty('endTime');
        expect(response.body.data.endTime).not.toBeNull();
        expect(response.body.data).toHaveProperty('durationMinutes', 480);
        expect(response.body.data).toHaveProperty('entryMode', 'day');
        expect(response.body.data).toHaveProperty('blocks');
        expect(response.body.data.blocks).toEqual([]);
      });
    });

    describe('AC4: End Day - No Active Day', () => {
      it('should return 404 when no active day exists', async () => {
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
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/day/end')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NO_ACTIVE_DAY');
        expect(response.body.error).toHaveProperty('message', 'No active day found');
      });
    });
  });

  describe('GET /api/v1/time-entries/day/active', () => {
    describe('Authentication', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .get('/api/v1/time-entries/day/active');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('AC5: Get Active Day with Blocks', () => {
      it('should return active day with blocks', async () => {
        const activeDay = {
          id: mockEntryId,
          user_id: mockEmployeeProfile.id,
          project_id: null,
          category_id: null,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: null,
          duration_minutes: null,
          description: 'Working from home',
          entry_mode: 'day',
          parent_id: null,
          created_at: '2026-01-12T08:00:00.000Z',
          updated_at: '2026-01-12T08:00:00.000Z'
        };

        const blocks = [
          {
            id: 'block-1-uuid',
            user_id: mockEmployeeProfile.id,
            project_id: mockProjectId,
            category_id: mockCategoryId,
            start_time: '2026-01-12T08:00:00.000Z',
            end_time: '2026-01-12T10:00:00.000Z',
            duration_minutes: 120,
            description: 'Morning work',
            entry_mode: 'day',
            parent_id: mockEntryId,
            created_at: '2026-01-12T08:00:00.000Z',
            updated_at: '2026-01-12T10:00:00.000Z',
            projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
            categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
          }
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
          // getActiveDay
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      is: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                          data: activeDay,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            };
          }
          // getDayWithBlocks - get day
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: activeDay,
                    error: null
                  })
                })
              })
            };
          }
          // getDayWithBlocks - get blocks
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: blocks,
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/day/active')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).not.toBeNull();
        expect(response.body.data).toHaveProperty('id', mockEntryId);
        expect(response.body.data).toHaveProperty('entryMode', 'day');
        expect(response.body.data).toHaveProperty('endTime', null);
        expect(response.body.data).toHaveProperty('blocks');
        expect(response.body.data.blocks).toHaveLength(1);
        expect(response.body.data.blocks[0]).toHaveProperty('project');
        expect(response.body.data.blocks[0].project).toHaveProperty('name', 'Time Manager');
      });
    });

    describe('AC6: Get Active Day - No Active Day', () => {
      it('should return null when no active day', async () => {
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
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/day/active')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeNull();
      });
    });
  });

  describe('AC7: Day and Simple Timer Coexistence', () => {
    it('should allow starting simple timer while day is active', async () => {
      const activeDay = {
        id: 'day-entry-id',
        user_id: mockEmployeeProfile.id,
        entry_mode: 'day',
        end_time: null,
        parent_id: null
      };

      const mockCreatedTimer = {
        id: mockEntryId,
        user_id: mockEmployeeProfile.id,
        project_id: null,
        category_id: null,
        start_time: new Date().toISOString(),
        end_time: null,
        duration_minutes: null,
        description: null,
        entry_mode: 'simple',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

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
        // getActiveTimer checks for simple mode only, returns null
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null,
                      error: null
                    })
                  })
                })
              })
            })
          };
        }
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockCreatedTimer,
                error: null
              })
            })
          })
        };
      });

      const response = await request(app)
        .post('/api/v1/time-entries/start')
        .set('Authorization', 'Bearer employee-token')
        .send({});

      // Simple timer can be started regardless of active day (they are independent)
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('entryMode', 'simple');
    });
  });

  // ===========================================
  // Day Mode Time Block Routes (Story 4.6)
  // ===========================================

  describe('POST /api/v1/time-entries/day/blocks', () => {
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';
    const mockBlockId = '550e8400-e29b-41d4-a716-446655440600';

    describe('Authentication', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .post('/api/v1/time-entries/day/blocks')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            endTime: '2026-01-12T12:00:00.000Z'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('AC1: Create Block Successfully', () => {
      it('should create block and return 201', async () => {
        const activeDay = {
          id: mockDayId,
          user_id: mockEmployeeProfile.id,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: '2026-01-12T18:00:00.000Z',
          entry_mode: 'day',
          parent_id: null
        };

        const createdBlock = {
          id: mockBlockId,
          user_id: mockEmployeeProfile.id,
          parent_id: mockDayId,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          duration_minutes: 180,
          description: 'Morning work',
          entry_mode: 'day',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        };

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
          // getActiveDay
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      is: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                          data: activeDay,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            };
          }
          // getBlocksForDay
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            };
          }
          // insert
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: createdBlock,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/day/blocks')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            endTime: '2026-01-12T12:00:00.000Z',
            projectId: mockProjectId,
            categoryId: mockCategoryId,
            description: 'Morning work'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockBlockId);
        expect(response.body.data).toHaveProperty('parentId', mockDayId);
        expect(response.body.data).toHaveProperty('entryMode', 'day');
        expect(response.body.data).toHaveProperty('durationMinutes', 180);
        expect(response.body.data).toHaveProperty('project');
        expect(response.body.data.project).toHaveProperty('name', 'Time Manager');
      });
    });

    describe('AC8: No Active Day Error', () => {
      it('should return 404 when no active day exists', async () => {
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
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post('/api/v1/time-entries/day/blocks')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z',
            endTime: '2026-01-12T12:00:00.000Z'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NO_ACTIVE_DAY');
        expect(response.body.error).toHaveProperty('message', 'No active day found. Start a day first.');
      });
    });

    describe('Validation', () => {
      it('should return 400 when startTime is missing', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries/day/blocks')
          .set('Authorization', 'Bearer employee-token')
          .send({
            endTime: '2026-01-12T12:00:00.000Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when endTime is missing', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries/day/blocks')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T09:00:00.000Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when endTime is before startTime', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/time-entries/day/blocks')
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T12:00:00.000Z',
            endTime: '2026-01-12T09:00:00.000Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });
  });

  describe('GET /api/v1/time-entries/day/blocks', () => {
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

    describe('Authentication', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .get('/api/v1/time-entries/day/blocks');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('AC10: List Day Blocks', () => {
      it('should return blocks with meta for active day', async () => {
        const activeDay = {
          id: mockDayId,
          user_id: mockEmployeeProfile.id,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: null,
          entry_mode: 'day',
          parent_id: null
        };

        const blocks = [
          {
            id: 'block-1',
            user_id: mockEmployeeProfile.id,
            parent_id: mockDayId,
            start_time: '2026-01-12T09:00:00.000Z',
            end_time: '2026-01-12T12:00:00.000Z',
            duration_minutes: 180,
            entry_mode: 'day',
            projects: null,
            categories: null
          }
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
          // getActiveDay
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      is: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                          data: activeDay,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            };
          }
          // getBlocksForDay
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: blocks,
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/day/blocks')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.meta).toHaveProperty('dayId', mockDayId);
        expect(response.body.meta).toHaveProperty('dayStart', '2026-01-12T08:00:00.000Z');
        expect(response.body.meta).toHaveProperty('totalBlocksMinutes', 180);
      });

      it('should return empty result when no active day', async () => {
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
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    is: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                      })
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .get('/api/v1/time-entries/day/blocks')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual([]);
        expect(response.body.meta).toHaveProperty('dayId', null);
        expect(response.body.meta).toHaveProperty('totalBlocksMinutes', 0);
      });
    });
  });

  describe('PATCH /api/v1/time-entries/day/blocks/:blockId', () => {
    const mockBlockId = '550e8400-e29b-41d4-a716-446655440600';

    describe('Authentication', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .send({ description: 'Updated' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('Validation', () => {
      it('should return 400 when no data provided', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when endTime is before startTime', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T14:00:00.000Z',
            endTime: '2026-01-12T10:00:00.000Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('AC4: Update Block Successfully', () => {
      const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

      it('should update block times and return 200', async () => {
        const blockDb = {
          id: mockBlockId,
          user_id: mockEmployeeProfile.id,
          parent_id: mockDayId,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          duration_minutes: 180,
          description: 'Morning work',
          entry_mode: 'day',
          created_at: '2026-01-12T09:00:00.000Z',
          updated_at: '2026-01-12T09:00:00.000Z',
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        };

        const parentDay = {
          id: mockDayId,
          user_id: mockEmployeeProfile.id,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: '2026-01-12T18:00:00.000Z',
          entry_mode: 'day'
        };

        const updatedBlockDb = {
          ...blockDb,
          start_time: '2026-01-12T10:00:00.000Z',
          end_time: '2026-01-12T13:00:00.000Z',
          duration_minutes: 180,
          updated_at: new Date().toISOString()
        };

        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          // Profile fetch
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
          // getBlockById
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  not: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: blockDb,
                      error: null
                    })
                  })
                })
              })
            };
          }
          // Get parent day
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: parentDay,
                    error: null
                  })
                })
              })
            };
          }
          // getBlocksForDay
          if (callCount === 4) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            };
          }
          // Update
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: updatedBlockDb,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T10:00:00.000Z',
            endTime: '2026-01-12T13:00:00.000Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockBlockId);
        expect(response.body.data).toHaveProperty('startTime', '2026-01-12T10:00:00.000Z');
        expect(response.body.data).toHaveProperty('endTime', '2026-01-12T13:00:00.000Z');
        expect(response.body.data).toHaveProperty('project');
      });

      it('should update description only', async () => {
        const blockDb = {
          id: mockBlockId,
          user_id: mockEmployeeProfile.id,
          parent_id: mockDayId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          duration_minutes: 180,
          description: 'Original',
          entry_mode: 'day',
          projects: null,
          categories: null
        };

        const parentDay = {
          id: mockDayId,
          user_id: mockEmployeeProfile.id,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: '2026-01-12T18:00:00.000Z',
          entry_mode: 'day'
        };

        const updatedBlockDb = {
          ...blockDb,
          description: 'Updated description',
          updated_at: new Date().toISOString()
        };

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
                eq: jest.fn().mockReturnValue({
                  not: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: blockDb,
                      error: null
                    })
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
                    data: parentDay,
                    error: null
                  })
                })
              })
            };
          }
          if (callCount === 4) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            };
          }
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: updatedBlockDb,
                      error: null
                    })
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Updated description' });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('description', 'Updated description');
      });
    });

    describe('AC5: Update Block Validation', () => {
      const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

      it('should return 400 BLOCK_OUTSIDE_DAY_BOUNDARIES when update exceeds day bounds', async () => {
        const blockDb = {
          id: mockBlockId,
          user_id: mockEmployeeProfile.id,
          parent_id: mockDayId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          entry_mode: 'day'
        };

        const parentDay = {
          id: mockDayId,
          user_id: mockEmployeeProfile.id,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: '2026-01-12T18:00:00.000Z',
          entry_mode: 'day'
        };

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
                eq: jest.fn().mockReturnValue({
                  not: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: blockDb,
                      error: null
                    })
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: parentDay,
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ endTime: '2026-01-12T20:00:00.000Z' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'BLOCK_OUTSIDE_DAY_BOUNDARIES');
      });

      it('should return 400 BLOCKS_OVERLAP when update causes overlap', async () => {
        const blockDb = {
          id: mockBlockId,
          user_id: mockEmployeeProfile.id,
          parent_id: mockDayId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          entry_mode: 'day'
        };

        const parentDay = {
          id: mockDayId,
          user_id: mockEmployeeProfile.id,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: '2026-01-12T18:00:00.000Z',
          entry_mode: 'day'
        };

        const existingBlocks = [{
          id: 'other-block-id',
          startTime: '2026-01-12T14:00:00.000Z',
          endTime: '2026-01-12T17:00:00.000Z'
        }];

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
                eq: jest.fn().mockReturnValue({
                  not: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: blockDb,
                      error: null
                    })
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
                    data: parentDay,
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
                  order: jest.fn().mockResolvedValue({
                    data: existingBlocks,
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({
            startTime: '2026-01-12T13:00:00.000Z',
            endTime: '2026-01-12T15:00:00.000Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'BLOCKS_OVERLAP');
      });
    });

    describe('AC7: Block Ownership Validation', () => {
      it('should return 403 when block belongs to another user', async () => {
        const blockDb = {
          id: mockBlockId,
          user_id: 'other-user-id',
          parent_id: '550e8400-e29b-41d4-a716-446655440500',
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          entry_mode: 'day'
        };

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
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: blockDb,
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Trying to update' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });
    });

    describe('AC9: Block Not Found', () => {
      it('should return 404 when block not found', async () => {
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
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
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
          .patch(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ description: 'Test' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });
  });

  describe('DELETE /api/v1/time-entries/day/blocks/:blockId', () => {
    const mockBlockId = '550e8400-e29b-41d4-a716-446655440600';
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

    describe('Authentication', () => {
      it('should return 401 without auth', async () => {
        const response = await request(app)
          .delete(`/api/v1/time-entries/day/blocks/${mockBlockId}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });

    describe('AC6: Delete Block Successfully', () => {
      it('should delete block and return 200', async () => {
        const blockDb = {
          id: mockBlockId,
          user_id: mockEmployeeProfile.id,
          parent_id: mockDayId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          entry_mode: 'day',
          projects: null,
          categories: null
        };

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
          // getBlockById
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  not: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: blockDb,
                      error: null
                    })
                  })
                })
              })
            };
          }
          // delete
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
          .delete(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('message', 'Time block deleted successfully');
      });
    });

    describe('AC9: Block Not Found', () => {
      it('should return 404 when block not found', async () => {
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
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
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
          .delete(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('AC7: Block Ownership Validation', () => {
      it('should return 403 when block belongs to another user', async () => {
        const blockDb = {
          id: mockBlockId,
          user_id: 'other-user-id',
          parent_id: mockDayId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          entry_mode: 'day'
        };

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
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: blockDb,
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/time-entries/day/blocks/${mockBlockId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });
    });
  });
});
