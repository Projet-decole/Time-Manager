// backend/tests/routes/categories.routes.test.js

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

describe('Categories Routes', () => {
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

  const mockCategoryId = '550e8400-e29b-41d4-a716-446655440100';

  const mockCategoryDb = {
    id: mockCategoryId,
    name: 'Development',
    description: 'Coding and development work',
    color: '#3B82F6',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  const mockCategoriesList = [
    mockCategoryDb,
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      name: 'Meeting',
      description: 'Team meetings and calls',
      color: '#10B981',
      is_active: true,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z'
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
        eq: jest.fn().mockImplementation((field, value) => {
          if (field === 'id' && value === mockManagerProfile.id) {
            return {
              single: jest.fn().mockResolvedValue({
                data: mockManagerProfile,
                error: null
              })
            };
          }
          if (field === 'is_active') {
            return {
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockCategoriesList,
                  error: null,
                  count: 2
                })
              })
            };
          }
          return {
            single: jest.fn().mockResolvedValue({
              data: mockCategoryDb,
              error: null
            })
          };
        }),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockCategoriesList,
            error: null,
            count: 2
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCategoryDb,
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCategoryDb,
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
        eq: jest.fn().mockImplementation((field, value) => {
          if (field === 'id' && value === mockEmployeeProfile.id) {
            return {
              single: jest.fn().mockResolvedValue({
                data: mockEmployeeProfile,
                error: null
              })
            };
          }
          if (field === 'is_active') {
            return {
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockCategoriesList,
                  error: null,
                  count: 2
                })
              })
            };
          }
          return {
            single: jest.fn().mockResolvedValue({
              data: mockCategoryDb,
              error: null
            })
          };
        })
      })
    });
  };

  // ===========================================
  // GET /api/v1/categories - List Categories (AC2)
  // ===========================================
  describe('GET /api/v1/categories', () => {
    describe('AC2: List all categories with pagination', () => {
      it('should return 200 with paginated category list for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/categories')
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

      it('should return categories in camelCase format', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get('/api/v1/categories')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name', 'Development');
        expect(response.body.data[0]).toHaveProperty('color', '#3B82F6');
        expect(response.body.data[0]).toHaveProperty('isActive');
        expect(response.body.data[0]).toHaveProperty('createdAt');
        expect(response.body.data[0]).not.toHaveProperty('created_at');
        expect(response.body.data[0]).not.toHaveProperty('is_active');
      });

      it('should return 200 for manager as well', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should support includeInactive query param for manager', async () => {
        const allCategories = [
          ...mockCategoriesList,
          {
            id: '550e8400-e29b-41d4-a716-446655440102',
            name: 'Archived',
            description: 'Old category',
            color: '#666666',
            is_active: false,
            created_at: '2026-01-03T00:00:00.000Z',
            updated_at: '2026-01-03T00:00:00.000Z'
          }
        ];

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
                  error: null
                })
              };
            }),
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: allCategories,
                error: null,
                count: 3
              })
            })
          })
        });

        const response = await request(app)
          .get('/api/v1/categories?includeInactive=true')
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should respect page and limit parameters', async () => {
        supabase.auth.getUser.mockResolvedValue({
          data: { user: mockEmployeeUser },
          error: null
        });

        const mockRange = jest.fn().mockResolvedValue({
          data: [mockCategoriesList[0]],
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
          .get('/api/v1/categories?page=2&limit=1')
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.meta.pagination.page).toBe(2);
        expect(response.body.meta.pagination.limit).toBe(1);
      });
    });

    describe('Authorization Check', () => {
      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get('/api/v1/categories');

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
          .get('/api/v1/categories')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // POST /api/v1/categories - Create Category (AC1)
  // ===========================================
  describe('POST /api/v1/categories', () => {
    describe('AC1: Create Category', () => {
      it('should return 201 with created category data for manager', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            description: 'Coding and development work',
            color: '#3B82F6'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name', 'Development');
        expect(response.body.data).toHaveProperty('color', '#3B82F6');
        expect(response.body.data).toHaveProperty('isActive', true);
        expect(response.body.data).toHaveProperty('createdAt');
        expect(response.body.data).toHaveProperty('updatedAt');
      });

      it('should create category without description', async () => {
        const categoryNoDesc = { ...mockCategoryDb, description: null };

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
                data: categoryNoDesc,
                error: null
              })
            })
          })
        });

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            color: '#3B82F6'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('AC8: Color Validation', () => {
      it('should return 400 when color is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            description: 'Some description'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when color format is invalid (no hash)', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            color: '3B82F6' // Missing #
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'color',
              message: 'Color must be in hex format (#RRGGBB)'
            })
          ])
        );
      });

      it('should return 400 when color format is invalid (word)', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            color: 'red'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when color has invalid hex characters', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            color: '#GGGGGG'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when color has wrong length', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            color: '#FFF' // Too short
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should accept valid lowercase hex color', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            color: '#ff5733'
          });

        expect(response.status).toBe(201);
      });

      it('should accept valid uppercase hex color', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            color: '#FF5733'
          });

        expect(response.status).toBe(201);
      });
    });

    describe('Validation', () => {
      it('should return 400 when name is missing', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            description: 'Some description',
            color: '#3B82F6'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when name is empty', async () => {
        setupManagerAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: '',
            color: '#3B82F6'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Category name cannot be empty'
            })
          ])
        );
      });

      it('should return 400 when name exceeds 50 characters', async () => {
        setupManagerAuth();

        const longName = 'a'.repeat(51);
        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: longName,
            color: '#3B82F6'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Category name cannot exceed 50 characters'
            })
          ])
        );
      });

      it('should return 400 when description exceeds 200 characters', async () => {
        setupManagerAuth();

        const longDesc = 'a'.repeat(201);
        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: 'Development',
            description: longDesc,
            color: '#3B82F6'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: 'Description cannot exceed 200 characters'
            })
          ])
        );
      });

      it('should allow name at exactly 50 characters', async () => {
        setupManagerAuth();

        const exactName = 'a'.repeat(50);
        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer manager-token')
          .send({
            name: exactName,
            color: '#3B82F6'
          });

        expect(response.status).toBe(201);
      });
    });

    describe('AC7: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', 'Bearer employee-token')
          .send({
            name: 'Development',
            color: '#3B82F6'
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post('/api/v1/categories')
          .send({
            name: 'Development',
            color: '#3B82F6'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // GET /api/v1/categories/:id - Get Category Details (AC3)
  // ===========================================
  describe('GET /api/v1/categories/:id', () => {
    describe('AC3: Get Category Details', () => {
      it('should return 200 with category details for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .get(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockCategoryId);
        expect(response.body.data).toHaveProperty('name', 'Development');
        expect(response.body.data).toHaveProperty('description', 'Coding and development work');
        expect(response.body.data).toHaveProperty('color', '#3B82F6');
        expect(response.body.data).toHaveProperty('isActive', true);
      });

      it('should return 200 for manager as well', async () => {
        setupManagerAuth();

        const response = await request(app)
          .get(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return 404 when category not found', async () => {
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
          .get(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('Authorization Check', () => {
      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .get(`/api/v1/categories/${mockCategoryId}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // PATCH /api/v1/categories/:id - Update Category (AC4)
  // ===========================================
  describe('PATCH /api/v1/categories/:id', () => {
    describe('AC4: Update Category', () => {
      it('should return 200 with updated category data for manager', async () => {
        const updatedCategory = { ...mockCategoryDb, name: 'Updated Development' };

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
                  data: updatedCategory,
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Updated Development' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Updated Development');
      });

      it('should allow updating color only', async () => {
        const updatedCategory = { ...mockCategoryDb, color: '#FF5733' };

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
                  data: updatedCategory,
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ color: '#FF5733' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('color', '#FF5733');
      });

      it('should return 404 when category not found', async () => {
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
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: 'Updated' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });
    });

    describe('Validation', () => {
      it('should return 400 when name is empty', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ name: '' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when color format is invalid', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({ color: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });

      it('should return 400 when no data to update', async () => {
        setupManagerAuth();

        const response = await request(app)
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    describe('AC7: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer employee-token')
          .send({ name: 'Updated' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .patch(`/api/v1/categories/${mockCategoryId}`)
          .send({ name: 'Updated' });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // DELETE /api/v1/categories/:id - Deactivate Category (AC5)
  // ===========================================
  describe('DELETE /api/v1/categories/:id', () => {
    describe('AC5: Deactivate Category (Soft Delete)', () => {
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
                    data: { id: mockCategoryId, is_active: true },
                    error: null
                  })
                })
              })
            };
          }
          // Third call is for update (soft delete)
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('message', 'Category deactivated');
      });

      it('should return 404 when category not found', async () => {
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
          // Second call is for existence check - category not found
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
          .delete(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });

      it('should return 400 when category is already deactivated', async () => {
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
          // Second call is for existence check - already inactive
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCategoryId, is_active: false },
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .delete(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'ALREADY_INACTIVE');
      });
    });

    describe('AC7: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .delete(`/api/v1/categories/${mockCategoryId}`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .delete(`/api/v1/categories/${mockCategoryId}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });

  // ===========================================
  // POST /api/v1/categories/:id/activate - Reactivate Category (AC6)
  // ===========================================
  describe('POST /api/v1/categories/:id/activate', () => {
    describe('AC6: Reactivate Category', () => {
      it('should return 200 with activated category data for manager', async () => {
        const activatedCategory = { ...mockCategoryDb, is_active: true };

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
                    data: { id: mockCategoryId, is_active: false },
                    error: null
                  })
                })
              })
            };
          }
          // Third call is for update (activate)
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: activatedCategory,
                    error: null
                  })
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/categories/${mockCategoryId}/activate`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', mockCategoryId);
        expect(response.body.data).toHaveProperty('isActive', true);
      });

      it('should return 404 when category not found', async () => {
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
          // Second call is for existence check - not found
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
          .post(`/api/v1/categories/${mockCategoryId}/activate`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      });

      it('should return 400 when category is already active', async () => {
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
          // Second call is for existence check - already active
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockCategoryId, is_active: true },
                  error: null
                })
              })
            })
          };
        });

        const response = await request(app)
          .post(`/api/v1/categories/${mockCategoryId}/activate`)
          .set('Authorization', 'Bearer manager-token');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'ALREADY_ACTIVE');
      });
    });

    describe('AC7: Authorization Check', () => {
      it('should return 403 Forbidden for employee', async () => {
        setupEmployeeAuth();

        const response = await request(app)
          .post(`/api/v1/categories/${mockCategoryId}/activate`)
          .set('Authorization', 'Bearer employee-token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      });

      it('should return 401 Unauthorized without auth header', async () => {
        const response = await request(app)
          .post(`/api/v1/categories/${mockCategoryId}/activate`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      });
    });
  });
});
