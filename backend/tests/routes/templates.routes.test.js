// backend/tests/routes/templates.routes.test.js

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

describe('Templates Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockOtherUserId = '550e8400-e29b-41d4-a716-446655440001';
  const mockTemplateId = '550e8400-e29b-41d4-a716-446655440100';
  const mockProjectId = '550e8400-e29b-41d4-a716-446655440200';
  const mockCategoryId = '550e8400-e29b-41d4-a716-446655440300';
  const mockDayId = '550e8400-e29b-41d4-a716-446655440400';
  const mockEntryId = '550e8400-e29b-41d4-a716-446655440500';

  const mockUser = {
    id: mockUserId,
    email: 'employee@example.com'
  };

  const mockUserProfile = {
    id: mockUserId,
    email: 'employee@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'employee',
    weekly_hours_target: 35,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  const mockTemplateDb = {
    id: mockTemplateId,
    user_id: mockUserId,
    name: 'Morning Routine',
    description: 'Standard morning work pattern',
    config: null,
    created_at: '2026-01-12T10:00:00.000Z',
    updated_at: '2026-01-12T10:00:00.000Z',
    template_entries: [
      {
        id: mockEntryId,
        template_id: mockTemplateId,
        start_time: '09:00:00',
        end_time: '12:00:00',
        project_id: mockProjectId,
        category_id: mockCategoryId,
        description: 'Morning development',
        sort_order: 0,
        created_at: '2026-01-12T10:00:00.000Z',
        updated_at: '2026-01-12T10:00:00.000Z',
        projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
        categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
      }
    ]
  };

  const mockTemplatesList = [mockTemplateDb];

  // Helper to setup authentication
  const setupAuth = (profile = mockUserProfile) => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: profile.id, email: profile.email } },
      error: null
    });
  };

  // Helper to setup profile fetch (for auth middleware)
  const setupProfileFetch = (profile = mockUserProfile) => {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockImplementation((field, value) => {
          if (field === 'id' && value === profile.id) {
            return {
              single: jest.fn().mockResolvedValue({
                data: profile,
                error: null
              })
            };
          }
          return {
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          };
        })
      })
    };
  };

  // ===========================================
  // Authentication Tests
  // ===========================================
  describe('Authentication', () => {
    it('GET /templates without auth returns 401', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const response = await request(app)
        .get('/api/v1/templates')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /templates without auth returns 401', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const response = await request(app)
        .post('/api/v1/templates')
        .send({ name: 'Test', entries: [{ startTime: '09:00', endTime: '12:00' }] })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /templates/:id without auth returns 401', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const response = await request(app)
        .get(`/api/v1/templates/${mockTemplateId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('PATCH /templates/:id without auth returns 401', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const response = await request(app)
        .patch(`/api/v1/templates/${mockTemplateId}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('DELETE /templates/:id without auth returns 401', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const response = await request(app)
        .delete(`/api/v1/templates/${mockTemplateId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /templates/from-day/:dayId without auth returns 401', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const response = await request(app)
        .post(`/api/v1/templates/from-day/${mockDayId}`)
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ===========================================
  // GET /templates Tests
  // ===========================================
  describe('GET /templates', () => {
    it('should return templates with entries and pagination', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        // First call is for profile (auth middleware)
        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        // Second call is for count
        if (fromCallCount === 2 && table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 1, error: null })
            })
          };
        }

        // Third call is for templates list
        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: mockTemplatesList,
                    error: null
                  })
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Morning Routine');
      expect(response.body.data[0].entries).toBeDefined();
      expect(response.body.meta.pagination).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (fromCallCount === 2 && table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 5, error: null })
            })
          };
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockImplementation((start, end) => {
                    expect(start).toBe(10); // page 2, limit 10 => offset 10
                    expect(end).toBe(19); // offset + limit - 1
                    return Promise.resolve({
                      data: [],
                      error: null
                    });
                  })
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get('/api/v1/templates?page=2&limit=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.pagination.page).toBe(2);
      expect(response.body.meta.pagination.limit).toBe(10);
    });
  });

  // ===========================================
  // GET /templates/:id Tests
  // ===========================================
  describe('GET /templates/:id', () => {
    it('should return template with entries', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateDb,
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockTemplateId);
      expect(response.body.data.name).toBe('Morning Routine');
      expect(response.body.data.entries).toHaveLength(1);
      expect(response.body.data.entries[0].startTime).toBe('09:00');
    });

    it('should return 404 for non-existent template', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get(`/api/v1/templates/99999999-9999-4999-a999-999999999999`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      setupAuth();
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return setupProfileFetch();
        }
        return setupProfileFetch();
      });

      const response = await request(app)
        .get('/api/v1/templates/invalid-uuid-format')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ID');
    });

    it('should return 403 for template belonging to another user', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockTemplateDb, user_id: mockOtherUserId },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ===========================================
  // POST /templates Tests
  // ===========================================
  describe('POST /templates', () => {
    const validCreateData = {
      name: 'New Template',
      description: 'Test description',
      entries: [
        {
          startTime: '09:00',
          endTime: '12:00',
          projectId: mockProjectId,
          categoryId: mockCategoryId,
          description: 'Morning work'
        }
      ]
    };

    it('should create template with entries', async () => {
      setupAuth();

      const mockCreatedTemplate = {
        id: mockTemplateId,
        user_id: mockUserId,
        name: 'New Template',
        description: 'Test description',
        config: null,
        created_at: '2026-01-12T10:00:00.000Z',
        updated_at: '2026-01-12T10:00:00.000Z'
      };

      const mockCreatedEntries = [{
        id: mockEntryId,
        template_id: mockTemplateId,
        start_time: '09:00:00',
        end_time: '12:00:00',
        project_id: mockProjectId,
        category_id: mockCategoryId,
        description: 'Morning work',
        sort_order: 0,
        created_at: '2026-01-12T10:00:00.000Z',
        updated_at: '2026-01-12T10:00:00.000Z',
        projects: { id: mockProjectId, code: 'PRJ', name: 'Project' },
        categories: { id: mockCategoryId, name: 'Dev', color: '#000' }
      }];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedTemplate,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'template_entries') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedEntries,
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .send(validCreateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Template');
      expect(response.body.data.entries).toHaveLength(1);
    });

    it('should return 400 for missing name', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .send({
          entries: [{ startTime: '09:00', endTime: '12:00' }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing entries', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test Template'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty entries array', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test Template',
          entries: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid time format', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test Template',
          entries: [{ startTime: '9:00', endTime: '12:00' }] // Invalid: should be 09:00
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for endTime <= startTime', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test Template',
          entries: [{ startTime: '12:00', endTime: '09:00' }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for name exceeding 100 characters', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'a'.repeat(101),
          entries: [{ startTime: '09:00', endTime: '12:00' }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================================
  // PATCH /templates/:id Tests
  // ===========================================
  describe('PATCH /templates/:id', () => {
    it('should update template name', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          // Verify ownership
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockTemplateId, user_id: mockUserId },
                  error: null
                })
              })
            })
          };
        }

        if (table === 'templates' && fromCallCount === 3) {
          // Update
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        }

        // getById call
        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockTemplateDb, name: 'Updated Name' },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .patch(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 400 for empty update body', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .patch(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 for non-owner', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockTemplateId, user_id: mockOtherUserId },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .patch(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ===========================================
  // DELETE /templates/:id Tests
  // ===========================================
  describe('DELETE /templates/:id', () => {
    it('should delete template successfully', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          // Verify ownership
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockTemplateId, user_id: mockUserId },
                  error: null
                })
              })
            })
          };
        }

        if (table === 'templates') {
          // Delete
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .delete(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Template deleted successfully');
    });

    it('should return 404 for non-existent template', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .delete(`/api/v1/templates/99999999-9999-4999-a999-999999999999`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 for non-owner', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockTemplateId, user_id: mockOtherUserId },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .delete(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ===========================================
  // POST /templates/from-day/:dayId Tests
  // ===========================================
  describe('POST /templates/from-day/:dayId', () => {
    const mockDayEntry = {
      id: mockDayId,
      user_id: mockUserId,
      entry_mode: 'day',
      parent_id: null
    };

    const mockBlocks = [
      {
        id: 'block-1',
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z',
        project_id: mockProjectId,
        category_id: mockCategoryId,
        description: 'Morning work'
      }
    ];

    it('should create template from day', async () => {
      setupAuth();

      const mockCreatedTemplate = {
        id: mockTemplateId,
        user_id: mockUserId,
        name: 'From Day',
        description: null,
        config: null,
        created_at: '2026-01-12T10:00:00.000Z',
        updated_at: '2026-01-12T10:00:00.000Z'
      };

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        // Fetch day entry
        if (table === 'time_entries' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockDayEntry,
                  error: null
                })
              })
            })
          };
        }

        // Fetch blocks
        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockBlocks,
                    error: null
                  })
                })
              })
            })
          };
        }

        // Create template
        if (table === 'templates') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedTemplate,
                  error: null
                })
              })
            })
          };
        }

        // Create entries
        if (table === 'template_entries') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [{
                  id: mockEntryId,
                  template_id: mockTemplateId,
                  start_time: '09:00:00',
                  end_time: '12:00:00',
                  project_id: mockProjectId,
                  category_id: mockCategoryId,
                  description: 'Morning work',
                  sort_order: 0,
                  projects: { id: mockProjectId, code: 'PRJ', name: 'Project' },
                  categories: { id: mockCategoryId, name: 'Dev', color: '#000' }
                }],
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/from-day/${mockDayId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'From Day' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('From Day');
      expect(response.body.data.entries).toHaveLength(1);
      expect(response.body.data.meta).toBeDefined();
      expect(response.body.data.meta.sourceDayId).toBe(mockDayId);
    });

    it('should return 400 for missing name', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post(`/api/v1/templates/from-day/${mockDayId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent day', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'time_entries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/from-day/99999999-9999-4999-a999-999999999999`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 for day belonging to another user', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'time_entries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockDayEntry, user_id: mockOtherUserId },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/from-day/${mockDayId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for simple mode entry', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'time_entries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockDayEntry, entry_mode: 'simple' },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/from-day/${mockDayId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_DAY_MODE_ENTRY');
    });

    it('should return 400 for day with no blocks', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'time_entries' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockDayEntry,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 3) {
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

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/from-day/${mockDayId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_BLOCKS');
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle template with single entry', async () => {
      setupAuth();

      const singleEntryTemplate = {
        ...mockTemplateDb,
        template_entries: [mockTemplateDb.template_entries[0]]
      };

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: singleEntryTemplate,
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.entries).toHaveLength(1);
    });

    it('should handle template with many entries (10)', async () => {
      setupAuth();

      const manyEntries = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        template_id: mockTemplateId,
        start_time: `0${i}:00:00`.slice(-8),
        end_time: `0${i + 1}:00:00`.slice(-8),
        project_id: null,
        category_id: null,
        description: `Entry ${i}`,
        sort_order: i,
        projects: null,
        categories: null
      }));

      const manyEntriesTemplate = {
        ...mockTemplateDb,
        template_entries: manyEntries
      };

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: manyEntriesTemplate,
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.entries).toHaveLength(10);
    });

    it('should handle entry with null project/category', async () => {
      setupAuth();

      const templateWithNullRefs = {
        ...mockTemplateDb,
        template_entries: [{
          ...mockTemplateDb.template_entries[0],
          project_id: null,
          category_id: null,
          projects: null,
          categories: null
        }]
      };

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: templateWithNullRefs,
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .get(`/api/v1/templates/${mockTemplateId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.entries[0].projectId).toBeNull();
      expect(response.body.data.entries[0].categoryId).toBeNull();
    });
  });

  // ===========================================
  // POST /templates/:id/apply Tests (Story 4.9)
  // ===========================================
  describe('POST /templates/:id/apply', () => {
    const mockTemplateWithEntries = {
      id: mockTemplateId,
      user_id: mockUserId,
      name: 'Morning Routine',
      description: 'Standard morning work pattern',
      template_entries: [
        {
          id: mockEntryId,
          template_id: mockTemplateId,
          start_time: '09:00:00',
          end_time: '12:00:00',
          project_id: mockProjectId,
          category_id: mockCategoryId,
          description: 'Morning development',
          sort_order: 0,
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        }
      ]
    };

    const validApplyData = {
      date: '2025-01-15'
    };

    it('POST /templates/:id/apply without auth returns 401', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .send(validApplyData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should apply template successfully and return 201', async () => {
      setupAuth();

      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T12:00:00.000Z',
        duration_minutes: 180,
        description: null,
        entry_mode: 'template',
        parent_id: null,
        created_at: '2026-01-12T10:00:00.000Z',
        updated_at: '2026-01-12T10:00:00.000Z'
      };

      const mockCreatedBlocks = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: '2025-01-15T09:00:00.000Z',
          end_time: '2025-01-15T12:00:00.000Z',
          duration_minutes: 180,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          description: 'Morning development',
          entry_mode: 'template',
          created_at: '2026-01-12T10:00:00.000Z',
          updated_at: '2026-01-12T10:00:00.000Z',
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        }
      ];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        // getById - get template
        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        // checkDateHasEntries
        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 0, error: null })
                  })
                })
              })
            })
          };
        }

        // validateReferences - projects
        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        // validateReferences - categories
        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        // Create day entry
        if (table === 'time_entries' && fromCallCount === 6) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedDay,
                  error: null
                })
              })
            })
          };
        }

        // Create blocks
        if (table === 'time_entries' && fromCallCount === 7) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('day-uuid');
      expect(response.body.data.entryMode).toBe('template');
      expect(response.body.data.blocks).toHaveLength(1);
      expect(response.body.data.blocks[0].entryMode).toBe('template');
      expect(response.body.meta.templateId).toBe(mockTemplateId);
      expect(response.body.meta.templateName).toBe('Morning Routine');
      expect(response.body.meta.entriesApplied).toBe(1);
    });

    it('should return 400 for missing date', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send({ date: '15-01-2025' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for date more than 1 year in the past', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 2);
      const dateStr = pastDate.toISOString().split('T')[0];

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send({ date: dateStr })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for date more than 1 year in the future', async () => {
      setupAuth();

      supabase.from.mockImplementation(() => setupProfileFetch());

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const dateStr = futureDate.toISOString().split('T')[0];

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send({ date: dateStr })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent template', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/99999999-9999-4999-a999-999999999999/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 for template belonging to another user', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockTemplateWithEntries, user_id: mockOtherUserId },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for template with no entries', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockTemplateWithEntries, template_entries: [] },
                  error: null
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TEMPLATE_EMPTY');
    });

    it('should return 400 when date already has entries', async () => {
      setupAuth();

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        // getById - get template
        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        // checkDateHasEntries - has entries
        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 2, error: null })
                  })
                })
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DATE_HAS_ENTRIES');
    });

    it('should include warnings in meta when references are archived/inactive', async () => {
      setupAuth();

      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T12:00:00.000Z',
        duration_minutes: 180,
        entry_mode: 'template',
        parent_id: null
      };

      const mockCreatedBlocks = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: '2025-01-15T09:00:00.000Z',
          end_time: '2025-01-15T12:00:00.000Z',
          duration_minutes: 180,
          project_id: null, // Cleared because archived
          category_id: mockCategoryId,
          entry_mode: 'template',
          projects: null,
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        }
      ];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 0, error: null })
                  })
                })
              })
            })
          };
        }

        // Project is archived
        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: true }],
                error: null
              })
            })
          };
        }

        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 6) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedDay,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 7) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.warnings).toBeDefined();
      expect(response.body.meta.warnings).toHaveLength(1);
      expect(response.body.meta.warnings[0].type).toBe('ARCHIVED_PROJECT');
    });

    it('should apply template for today\'s date', async () => {
      setupAuth();

      const today = new Date().toISOString().split('T')[0];

      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: `${today}T09:00:00.000Z`,
        end_time: `${today}T12:00:00.000Z`,
        duration_minutes: 180,
        entry_mode: 'template',
        parent_id: null
      };

      const mockCreatedBlocks = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: `${today}T09:00:00.000Z`,
          end_time: `${today}T12:00:00.000Z`,
          duration_minutes: 180,
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 0, error: null })
                  })
                })
              })
            })
          };
        }

        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 6) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedDay,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 7) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send({ date: today })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.startTime).toContain(today);
    });

    it('should apply template for future date within 1 year', async () => {
      setupAuth();

      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      const dateStr = futureDate.toISOString().split('T')[0];

      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: `${dateStr}T09:00:00.000Z`,
        end_time: `${dateStr}T12:00:00.000Z`,
        duration_minutes: 180,
        entry_mode: 'template',
        parent_id: null
      };

      const mockCreatedBlocks = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: `${dateStr}T09:00:00.000Z`,
          end_time: `${dateStr}T12:00:00.000Z`,
          duration_minutes: 180,
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 0, error: null })
                  })
                })
              })
            })
          };
        }

        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 6) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedDay,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 7) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send({ date: dateStr })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.startTime).toContain(dateStr);
    });

    it('should correctly convert times for different dates', async () => {
      setupAuth();

      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-06-20T09:00:00.000Z',
        end_time: '2025-06-20T12:00:00.000Z',
        duration_minutes: 180,
        entry_mode: 'template',
        parent_id: null
      };

      const mockCreatedBlocks = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: '2025-06-20T09:00:00.000Z',
          end_time: '2025-06-20T12:00:00.000Z',
          duration_minutes: 180,
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 0, error: null })
                  })
                })
              })
            })
          };
        }

        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 6) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedDay,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 7) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send({ date: '2025-06-20' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.startTime).toBe('2025-06-20T09:00:00.000Z');
      expect(response.body.data.endTime).toBe('2025-06-20T12:00:00.000Z');
      expect(response.body.data.blocks[0].startTime).toBe('2025-06-20T09:00:00.000Z');
      expect(response.body.data.blocks[0].endTime).toBe('2025-06-20T12:00:00.000Z');
    });

    it('should return blocks with correct parent_id reference', async () => {
      setupAuth();

      const mockCreatedDay = {
        id: 'parent-day-id',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T12:00:00.000Z',
        duration_minutes: 180,
        entry_mode: 'template',
        parent_id: null
      };

      const mockCreatedBlocks = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: 'parent-day-id',
          start_time: '2025-01-15T09:00:00.000Z',
          end_time: '2025-01-15T12:00:00.000Z',
          duration_minutes: 180,
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return setupProfileFetch();
        }

        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 0, error: null })
                  })
                })
              })
            })
          };
        }

        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 6) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedDay,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 7) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return setupProfileFetch();
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(201);

      expect(response.body.data.id).toBe('parent-day-id');
      expect(response.body.data.blocks[0].parentId).toBe('parent-day-id');
    });

    it('manager can apply own template', async () => {
      const managerProfile = {
        ...mockUserProfile,
        role: 'manager'
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: managerProfile.id, email: managerProfile.email } },
        error: null
      });

      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T12:00:00.000Z',
        duration_minutes: 180,
        entry_mode: 'template',
        parent_id: null
      };

      const mockCreatedBlocks = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: '2025-01-15T09:00:00.000Z',
          end_time: '2025-01-15T12:00:00.000Z',
          duration_minutes: 180,
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let fromCallCount = 0;
      supabase.from.mockImplementation((table) => {
        fromCallCount++;

        if (fromCallCount === 1 && table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field, value) => {
                if (field === 'id' && value === managerProfile.id) {
                  return {
                    single: jest.fn().mockResolvedValue({
                      data: managerProfile,
                      error: null
                    })
                  };
                }
                return {
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                };
              })
            })
          };
        }

        if (table === 'templates' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockTemplateWithEntries,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 0, error: null })
                  })
                })
              })
            })
          };
        }

        if (table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        if (table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 6) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCreatedDay,
                  error: null
                })
              })
            })
          };
        }

        if (table === 'time_entries' && fromCallCount === 7) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return setupProfileFetch(managerProfile);
      });

      const response = await request(app)
        .post(`/api/v1/templates/${mockTemplateId}/apply`)
        .set('Authorization', 'Bearer valid-token')
        .send(validApplyData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
