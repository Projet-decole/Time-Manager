// backend/tests/services/categories.service.test.js

const categoriesService = require('../../services/categories.service');
const AppError = require('../../utils/AppError');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Categories Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategoryId = '550e8400-e29b-41d4-a716-446655440000';

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
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Meeting',
      description: 'Team meetings and calls',
      color: '#10B981',
      is_active: true,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z'
    }
  ];

  // ===========================================
  // getAll
  // ===========================================
  describe('getAll', () => {
    it('should return paginated list of active categories in camelCase', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockCategoriesList,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      const result = await categoriesService.getAll();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', mockCategoryId);
      expect(result.data[0]).toHaveProperty('name', 'Development');
      expect(result.data[0]).toHaveProperty('color', '#3B82F6');
      expect(result.data[0]).toHaveProperty('isActive', true);
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).not.toHaveProperty('created_at');
      expect(result.data[0]).not.toHaveProperty('is_active');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 20);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should filter by active status by default', async () => {
      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockCategoriesList,
            error: null,
            count: 2
          })
        })
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq
        })
      });

      await categoriesService.getAll();

      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('should include inactive categories when includeInactive is true', async () => {
      const allCategories = [
        ...mockCategoriesList,
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Archived',
          description: 'Old category',
          color: '#666666',
          is_active: false,
          created_at: '2026-01-03T00:00:00.000Z',
          updated_at: '2026-01-03T00:00:00.000Z'
        }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: allCategories,
              error: null,
              count: 3
            })
          })
        })
      });

      const result = await categoriesService.getAll({ includeInactive: true });

      expect(result.data).toHaveLength(3);
      expect(result.data[2]).toHaveProperty('isActive', false);
    });

    it('should use custom pagination when provided', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: [mockCategoryDb],
        error: null,
        count: 50
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: mockRange
            })
          })
        })
      });

      const result = await categoriesService.getAll({ page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      // Offset should be (2-1)*10 = 10, so range(10, 19)
      expect(mockRange).toHaveBeenCalledWith(10, 19);
    });

    it('should throw DATABASE_ERROR when query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
                count: null
              })
            })
          })
        })
      });

      await expect(categoriesService.getAll())
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.getAll())
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should handle empty result', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
              })
            })
          })
        })
      });

      const result = await categoriesService.getAll();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle null data from database gracefully', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: null,
                count: 0
              })
            })
          })
        })
      });

      const result = await categoriesService.getAll();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ===========================================
  // getById
  // ===========================================
  describe('getById', () => {
    it('should return category in camelCase format', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCategoryDb,
              error: null
            })
          })
        })
      });

      const result = await categoriesService.getById(mockCategoryId);

      expect(result).toEqual({
        id: mockCategoryId,
        name: 'Development',
        description: 'Coding and development work',
        color: '#3B82F6',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should throw NOT_FOUND when category does not exist', async () => {
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

      await expect(categoriesService.getById(mockCategoryId))
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.getById(mockCategoryId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should query the categories table with correct ID', async () => {
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockCategoryDb,
          error: null
        })
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      });

      supabase.from.mockReturnValue({
        select: mockSelect
      });

      await categoriesService.getById(mockCategoryId);

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockEq).toHaveBeenCalledWith('id', mockCategoryId);
    });
  });

  // ===========================================
  // create
  // ===========================================
  describe('create', () => {
    it('should create category successfully and return in camelCase', async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCategoryDb,
              error: null
            })
          })
        })
      });

      const result = await categoriesService.create({
        name: 'Development',
        description: 'Coding and development work',
        color: '#3B82F6'
      });

      expect(result).toEqual({
        id: mockCategoryId,
        name: 'Development',
        description: 'Coding and development work',
        color: '#3B82F6',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should create category without description', async () => {
      const categoryNoDesc = { ...mockCategoryDb, description: null };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: categoryNoDesc,
              error: null
            })
          })
        })
      });

      const result = await categoriesService.create({
        name: 'Development',
        color: '#3B82F6'
      });

      expect(result).toHaveProperty('description', null);
    });

    it('should throw DUPLICATE_NAME when category name already exists', async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'duplicate key value' }
            })
          })
        })
      });

      await expect(categoriesService.create({
        name: 'Development',
        color: '#3B82F6'
      }))
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.create({
        name: 'Development',
        color: '#3B82F6'
      }))
        .rejects
        .toMatchObject({
          statusCode: 409,
          code: 'DUPLICATE_NAME'
        });
    });

    it('should throw CREATE_FAILED when database insert fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      await expect(categoriesService.create({
        name: 'Development',
        color: '#3B82F6'
      }))
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.create({
        name: 'Development',
        color: '#3B82F6'
      }))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'CREATE_FAILED'
        });

      consoleSpy.mockRestore();
    });

    it('should insert correct data to database', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCategoryDb,
            error: null
          })
        })
      });

      supabase.from.mockReturnValue({
        insert: mockInsert
      });

      await categoriesService.create({
        name: 'Development',
        description: 'Coding and development work',
        color: '#3B82F6'
      });

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Development',
        description: 'Coding and development work',
        color: '#3B82F6',
        is_active: true
      });
    });
  });

  // ===========================================
  // update
  // ===========================================
  describe('update', () => {
    it('should update category successfully and return in camelCase', async () => {
      const updatedCategoryDb = {
        ...mockCategoryDb,
        name: 'Updated Development',
        color: '#FF5733'
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedCategoryDb,
                error: null
              })
            })
          })
        })
      });

      const result = await categoriesService.update(mockCategoryId, {
        name: 'Updated Development',
        color: '#FF5733'
      });

      expect(result).toEqual({
        id: mockCategoryId,
        name: 'Updated Development',
        description: 'Coding and development work',
        color: '#FF5733',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should throw NOT_FOUND when category does not exist', async () => {
      supabase.from.mockReturnValue({
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

      await expect(categoriesService.update(mockCategoryId, { name: 'Updated' }))
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.update(mockCategoryId, { name: 'Updated' }))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw NOT_FOUND when update returns null data', async () => {
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      });

      await expect(categoriesService.update(mockCategoryId, { name: 'Updated' }))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw DUPLICATE_NAME when new name already exists', async () => {
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key value' }
              })
            })
          })
        })
      });

      await expect(categoriesService.update(mockCategoryId, { name: 'Existing Category' }))
        .rejects
        .toMatchObject({
          statusCode: 409,
          code: 'DUPLICATE_NAME'
        });
    });

    it('should throw UPDATE_FAILED when database update fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      await expect(categoriesService.update(mockCategoryId, { name: 'Updated' }))
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.update(mockCategoryId, { name: 'Updated' }))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'UPDATE_FAILED'
        });

      consoleSpy.mockRestore();
    });

    it('should include updated_at timestamp in update', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCategoryDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      await categoriesService.update(mockCategoryId, { name: 'Updated' });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(typeof updateCall.updated_at).toBe('string');
    });

    it('should filter out non-allowed fields', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCategoryDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      await categoriesService.update(mockCategoryId, {
        name: 'Updated',
        createdAt: '2025-01-01T00:00:00.000Z', // Should be filtered out
        id: 'new-id', // Should be filtered out
        isActive: false // Should be filtered out
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('name', 'Updated');
      expect(updateCall).not.toHaveProperty('id');
      expect(updateCall).not.toHaveProperty('created_at');
      expect(updateCall).not.toHaveProperty('is_active');
    });
  });

  // ===========================================
  // deactivate
  // ===========================================
  describe('deactivate', () => {
    it('should deactivate category successfully', async () => {
      // Mock for existence check
      const mockSingle = jest.fn()
        .mockResolvedValueOnce({ data: { id: mockCategoryId, is_active: true }, error: null });

      // Mock for update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        }),
        update: mockUpdate
      });

      const result = await categoriesService.deactivate(mockCategoryId);

      expect(result).toEqual({ message: 'Category deactivated' });
    });

    it('should throw NOT_FOUND when category does not exist', async () => {
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

      await expect(categoriesService.deactivate(mockCategoryId))
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.deactivate(mockCategoryId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw ALREADY_INACTIVE when category is already deactivated', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockCategoryId, is_active: false },
              error: null
            })
          })
        })
      });

      await expect(categoriesService.deactivate(mockCategoryId))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'ALREADY_INACTIVE'
        });
    });

    it('should throw DEACTIVATE_FAILED when database update fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // First call for existence check succeeds
      // Second call for update fails
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Database error' }
            })
          })
        };
      });

      await expect(categoriesService.deactivate(mockCategoryId))
        .rejects
        .toThrow(AppError);

      callCount = 0;
      await expect(categoriesService.deactivate(mockCategoryId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DEACTIVATE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // activate
  // ===========================================
  describe('activate', () => {
    it('should activate category successfully and return in camelCase', async () => {
      const activatedCategoryDb = { ...mockCategoryDb, is_active: true };

      // First call for existence check
      // Second call for update with select
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: activatedCategoryDb,
                  error: null
                })
              })
            })
          })
        };
      });

      const result = await categoriesService.activate(mockCategoryId);

      expect(result).toEqual({
        id: mockCategoryId,
        name: 'Development',
        description: 'Coding and development work',
        color: '#3B82F6',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should throw NOT_FOUND when category does not exist', async () => {
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

      await expect(categoriesService.activate(mockCategoryId))
        .rejects
        .toThrow(AppError);

      await expect(categoriesService.activate(mockCategoryId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw ALREADY_ACTIVE when category is already active', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockCategoryId, is_active: true },
              error: null
            })
          })
        })
      });

      await expect(categoriesService.activate(mockCategoryId))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'ALREADY_ACTIVE'
        });
    });

    it('should throw ACTIVATE_FAILED when database update fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // First call for existence check succeeds
      // Second call for update fails
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' }
                })
              })
            })
          })
        };
      });

      await expect(categoriesService.activate(mockCategoryId))
        .rejects
        .toThrow(AppError);

      callCount = 0;
      await expect(categoriesService.activate(mockCategoryId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'ACTIVATE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });
});
