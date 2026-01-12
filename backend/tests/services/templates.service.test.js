// backend/tests/services/templates.service.test.js

const templatesService = require('../../services/templates.service');
const AppError = require('../../utils/AppError');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Templates Service', () => {
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
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440501',
        template_id: mockTemplateId,
        start_time: '13:00:00',
        end_time: '17:00:00',
        project_id: null,
        category_id: null,
        description: 'Afternoon work',
        sort_order: 1,
        created_at: '2026-01-12T10:00:00.000Z',
        updated_at: '2026-01-12T10:00:00.000Z',
        projects: null,
        categories: null
      }
    ]
  };

  const mockTemplatesList = [mockTemplateDb];

  // ===========================================
  // Helper Functions Tests
  // ===========================================
  describe('Helper Functions', () => {
    describe('formatTimeToHHMM', () => {
      it('should format HH:MM:SS to HH:MM', () => {
        const result = templatesService.formatTimeToHHMM('09:30:00');
        expect(result).toBe('09:30');
      });

      it('should handle HH:MM format (no change needed)', () => {
        const result = templatesService.formatTimeToHHMM('09:30');
        expect(result).toBe('09:30');
      });

      it('should return null for null input', () => {
        const result = templatesService.formatTimeToHHMM(null);
        expect(result).toBeNull();
      });

      it('should return null for undefined input', () => {
        const result = templatesService.formatTimeToHHMM(undefined);
        expect(result).toBeNull();
      });
    });

    describe('convertDayBlocksToEntries', () => {
      it('should convert day blocks to template entries format', () => {
        const blocks = [
          {
            id: 'block-1',
            startTime: '2026-01-12T09:00:00.000Z',
            endTime: '2026-01-12T12:00:00.000Z',
            projectId: mockProjectId,
            categoryId: mockCategoryId,
            description: 'Morning work'
          },
          {
            id: 'block-2',
            startTime: '2026-01-12T13:00:00.000Z',
            endTime: '2026-01-12T17:00:00.000Z',
            projectId: null,
            categoryId: null,
            description: null
          }
        ];

        const result = templatesService.convertDayBlocksToEntries(blocks);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          startTime: '09:00',
          endTime: '12:00',
          projectId: mockProjectId,
          categoryId: mockCategoryId,
          description: 'Morning work',
          sortOrder: 0
        });
        expect(result[1]).toEqual({
          startTime: '13:00',
          endTime: '17:00',
          projectId: null,
          categoryId: null,
          description: null,
          sortOrder: 1
        });
      });

      it('should handle empty blocks array', () => {
        const result = templatesService.convertDayBlocksToEntries([]);
        expect(result).toEqual([]);
      });
    });

    describe('transformEntry', () => {
      it('should transform entry from database format', () => {
        const dbEntry = {
          id: mockEntryId,
          template_id: mockTemplateId,
          start_time: '09:00:00',
          end_time: '12:00:00',
          project_id: mockProjectId,
          category_id: mockCategoryId,
          description: 'Test',
          sort_order: 0,
          projects: { id: mockProjectId, code: 'PRJ', name: 'Project' },
          categories: { id: mockCategoryId, name: 'Dev', color: '#000' }
        };

        const result = templatesService.transformEntry(dbEntry);

        expect(result.id).toBe(mockEntryId);
        expect(result.templateId).toBe(mockTemplateId);
        expect(result.startTime).toBe('09:00');
        expect(result.endTime).toBe('12:00');
        expect(result.project).toEqual({ id: mockProjectId, code: 'PRJ', name: 'Project' });
        expect(result.category).toEqual({ id: mockCategoryId, name: 'Dev', color: '#000' });
        expect(result.projects).toBeUndefined();
        expect(result.categories).toBeUndefined();
      });
    });

    describe('transformTemplate', () => {
      it('should transform template from database format', () => {
        const result = templatesService.transformTemplate(mockTemplateDb);

        expect(result.id).toBe(mockTemplateId);
        expect(result.userId).toBe(mockUserId);
        expect(result.name).toBe('Morning Routine');
        expect(result.entries).toHaveLength(2);
        expect(result.templateEntries).toBeUndefined();
      });
    });
  });

  // ===========================================
  // getAll Tests
  // ===========================================
  describe('getAll', () => {
    it('should return templates for a user with pagination', async () => {
      // Mock count query
      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 1, error: null })
        })
      };

      // Mock templates query
      const mockTemplatesQuery = {
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

      supabase.from.mockImplementation((table) => {
        if (table === 'templates') {
          // Return count query first, then templates query
          if (supabase.from.mock.calls.length === 1) {
            return mockCountQuery;
          }
          return mockTemplatesQuery;
        }
        return mockTemplatesQuery;
      });

      const result = await templatesService.getAll(mockUserId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockTemplateId);
      expect(result.data[0].entries).toHaveLength(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
    });

    it('should return empty array when user has no templates', async () => {
      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null })
        })
      };

      const mockTemplatesQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      };

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockCountQuery;
        return mockTemplatesQuery;
      });

      const result = await templatesService.getAll(mockUserId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw DATABASE_ERROR on count query failure', async () => {
      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } })
        })
      };

      supabase.from.mockReturnValue(mockCountQuery);

      await expect(templatesService.getAll(mockUserId)).rejects.toThrow(AppError);
      await expect(templatesService.getAll(mockUserId)).rejects.toMatchObject({
        statusCode: 500,
        code: 'DATABASE_ERROR'
      });
    });
  });

  // ===========================================
  // getById Tests
  // ===========================================
  describe('getById', () => {
    it('should return template with entries for owner', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTemplateDb,
              error: null
            })
          })
        })
      });

      const result = await templatesService.getById(mockTemplateId, mockUserId);

      expect(result.id).toBe(mockTemplateId);
      expect(result.userId).toBe(mockUserId);
      expect(result.entries).toHaveLength(2);
    });

    it('should throw NOT_FOUND for non-existent template', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await expect(templatesService.getById('non-existent', mockUserId)).rejects.toThrow(AppError);
      await expect(templatesService.getById('non-existent', mockUserId)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND'
      });
    });

    it('should throw FORBIDDEN for non-owner', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTemplateDb,
              error: null
            })
          })
        })
      });

      await expect(templatesService.getById(mockTemplateId, mockOtherUserId)).rejects.toThrow(AppError);
      await expect(templatesService.getById(mockTemplateId, mockOtherUserId)).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });
    });
  });

  // ===========================================
  // create Tests
  // ===========================================
  describe('create', () => {
    const createData = {
      name: 'New Template',
      description: 'Test description',
      entries: [
        {
          startTime: '09:00',
          endTime: '12:00',
          projectId: mockProjectId,
          categoryId: mockCategoryId,
          description: 'Morning'
        }
      ]
    };

    it('should create template with entries successfully', async () => {
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
        description: 'Morning',
        sort_order: 0,
        created_at: '2026-01-12T10:00:00.000Z',
        updated_at: '2026-01-12T10:00:00.000Z',
        projects: { id: mockProjectId, code: 'PRJ', name: 'Project' },
        categories: { id: mockCategoryId, name: 'Dev', color: '#000' }
      }];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Template insert
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
        // Entries insert
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: mockCreatedEntries,
              error: null
            })
          })
        };
      });

      const result = await templatesService.create(mockUserId, createData);

      expect(result.id).toBe(mockTemplateId);
      expect(result.name).toBe('New Template');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].startTime).toBe('09:00');
    });

    it('should throw DATABASE_ERROR on template insert failure', async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' }
            })
          })
        })
      });

      await expect(templatesService.create(mockUserId, createData)).rejects.toThrow(AppError);
      await expect(templatesService.create(mockUserId, createData)).rejects.toMatchObject({
        statusCode: 500,
        code: 'DATABASE_ERROR'
      });
    });

    it('should throw INVALID_PROJECT_ID on foreign key violation', async () => {
      const mockCreatedTemplate = {
        id: mockTemplateId,
        user_id: mockUserId,
        name: 'New Template'
      };

      const setupMock = () => {
        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
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
          if (callCount === 2) {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23503', message: 'project_id violates foreign key' }
                })
              })
            };
          }
          // Cleanup delete
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        });
      };

      setupMock();
      await expect(templatesService.create(mockUserId, createData)).rejects.toThrow(AppError);

      setupMock();
      await expect(templatesService.create(mockUserId, createData)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_PROJECT_ID'
      });
    });
  });

  // ===========================================
  // update Tests
  // ===========================================
  describe('update', () => {
    it('should update template name and description', async () => {
      const updateData = { name: 'Updated Name', description: 'Updated desc' };

      // Mock fetch existing template
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        if (callCount === 2) {
          // Update template
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        }
        // getById call
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockTemplateDb, name: 'Updated Name', description: 'Updated desc' },
                error: null
              })
            })
          })
        };
      });

      const result = await templatesService.update(mockTemplateId, mockUserId, updateData);

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated desc');
    });

    it('should replace entries when entries array provided', async () => {
      const updateData = {
        entries: [
          { startTime: '10:00', endTime: '14:00', description: 'New entry' }
        ]
      };

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        if (callCount === 2) {
          // Delete old entries
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        }
        if (callCount === 3) {
          // Insert new entries
          return {
            insert: jest.fn().mockResolvedValue({ error: null })
          };
        }
        // getById call
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  ...mockTemplateDb,
                  template_entries: [{
                    id: 'new-entry',
                    template_id: mockTemplateId,
                    start_time: '10:00:00',
                    end_time: '14:00:00',
                    description: 'New entry',
                    sort_order: 0,
                    projects: null,
                    categories: null
                  }]
                },
                error: null
              })
            })
          })
        };
      });

      const result = await templatesService.update(mockTemplateId, mockUserId, updateData);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].startTime).toBe('10:00');
    });

    it('should throw NOT_FOUND for non-existent template', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await expect(
        templatesService.update('non-existent', mockUserId, { name: 'Test' })
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.update('non-existent', mockUserId, { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND'
      });
    });

    it('should throw FORBIDDEN for non-owner', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockTemplateId, user_id: mockUserId },
              error: null
            })
          })
        })
      });

      await expect(
        templatesService.update(mockTemplateId, mockOtherUserId, { name: 'Test' })
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.update(mockTemplateId, mockOtherUserId, { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });
    });
  });

  // ===========================================
  // remove Tests
  // ===========================================
  describe('remove', () => {
    it('should delete template successfully', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        // Delete
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        };
      });

      const result = await templatesService.remove(mockTemplateId, mockUserId);

      expect(result.message).toBe('Template deleted successfully');
    });

    it('should throw NOT_FOUND for non-existent template', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await expect(templatesService.remove('non-existent', mockUserId)).rejects.toThrow(AppError);
      await expect(templatesService.remove('non-existent', mockUserId)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND'
      });
    });

    it('should throw FORBIDDEN for non-owner', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockTemplateId, user_id: mockUserId },
              error: null
            })
          })
        })
      });

      await expect(templatesService.remove(mockTemplateId, mockOtherUserId)).rejects.toThrow(AppError);
      await expect(templatesService.remove(mockTemplateId, mockOtherUserId)).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });
    });
  });

  // ===========================================
  // createFromDay Tests
  // ===========================================
  describe('createFromDay', () => {
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
      },
      {
        id: 'block-2',
        start_time: '2026-01-12T13:00:00.000Z',
        end_time: '2026-01-12T17:00:00.000Z',
        project_id: null,
        category_id: null,
        description: null
      }
    ];

    it('should create template from day with blocks', async () => {
      const createFromDayData = { name: 'From Day', description: 'Created from day' };

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch day entry
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
        if (callCount === 2) {
          // Fetch blocks
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
        if (callCount === 3) {
          // Create template
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: mockTemplateId,
                    user_id: mockUserId,
                    name: 'From Day',
                    description: 'Created from day'
                  },
                  error: null
                })
              })
            })
          };
        }
        // Create entries
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'entry-1',
                  template_id: mockTemplateId,
                  start_time: '09:00:00',
                  end_time: '12:00:00',
                  sort_order: 0,
                  projects: { id: mockProjectId, code: 'PRJ', name: 'Project' },
                  categories: { id: mockCategoryId, name: 'Dev', color: '#000' }
                },
                {
                  id: 'entry-2',
                  template_id: mockTemplateId,
                  start_time: '13:00:00',
                  end_time: '17:00:00',
                  sort_order: 1,
                  projects: null,
                  categories: null
                }
              ],
              error: null
            })
          })
        };
      });

      const result = await templatesService.createFromDay(mockUserId, mockDayId, createFromDayData);

      expect(result.name).toBe('From Day');
      expect(result.entries).toHaveLength(2);
      expect(result.meta).toBeDefined();
      expect(result.meta.sourceDayId).toBe(mockDayId);
      expect(result.meta.blockCount).toBe(2);
    });

    it('should throw NOT_FOUND for non-existent day', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await expect(
        templatesService.createFromDay(mockUserId, 'non-existent', { name: 'Test' })
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.createFromDay(mockUserId, 'non-existent', { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND'
      });
    });

    it('should throw FORBIDDEN for day belonging to another user', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockDayEntry, user_id: mockOtherUserId },
              error: null
            })
          })
        })
      });

      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });
    });

    it('should throw NOT_DAY_MODE_ENTRY for simple mode entry', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockDayEntry, entry_mode: 'simple' },
              error: null
            })
          })
        })
      });

      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'NOT_DAY_MODE_ENTRY'
      });
    });

    it('should throw NOT_DAY_MODE_ENTRY for a block (has parent_id)', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockDayEntry, parent_id: 'some-parent-id' },
              error: null
            })
          })
        })
      });

      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'NOT_DAY_MODE_ENTRY'
      });
    });

    it('should throw NO_BLOCKS for day with no blocks', async () => {
      const setupMock = () => {
        let callCount = 0;
        supabase.from.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
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
          // Fetch blocks - empty
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
      };

      setupMock();
      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toThrow(AppError);

      setupMock();
      await expect(
        templatesService.createFromDay(mockUserId, mockDayId, { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'NO_BLOCKS'
      });
    });
  });

  // ===========================================
  // Helper Functions for applyTemplate Tests (Story 4.9)
  // ===========================================
  describe('applyTemplate Helper Functions', () => {
    describe('convertToAbsoluteTime', () => {
      it('should convert HH:MM to ISO timestamp for given date', () => {
        const result = templatesService.convertToAbsoluteTime('09:00', '2025-01-15');
        expect(result).toBe('2025-01-15T09:00:00.000Z');
      });

      it('should handle edge case 00:00', () => {
        const result = templatesService.convertToAbsoluteTime('00:00', '2025-01-15');
        expect(result).toBe('2025-01-15T00:00:00.000Z');
      });

      it('should handle edge case 23:59', () => {
        const result = templatesService.convertToAbsoluteTime('23:59', '2025-01-15');
        expect(result).toBe('2025-01-15T23:59:00.000Z');
      });

      it('should handle various times throughout the day', () => {
        expect(templatesService.convertToAbsoluteTime('12:30', '2025-06-20')).toBe('2025-06-20T12:30:00.000Z');
        expect(templatesService.convertToAbsoluteTime('17:45', '2025-06-20')).toBe('2025-06-20T17:45:00.000Z');
      });
    });

    describe('calculateDayBoundaries', () => {
      it('should calculate correct boundaries from entries', () => {
        const entries = [
          { startTime: '2025-01-15T09:00:00.000Z', endTime: '2025-01-15T12:00:00.000Z' },
          { startTime: '2025-01-15T13:00:00.000Z', endTime: '2025-01-15T17:00:00.000Z' }
        ];

        const result = templatesService.calculateDayBoundaries(entries);

        expect(result.dayStart).toBe('2025-01-15T09:00:00.000Z');
        expect(result.dayEnd).toBe('2025-01-15T17:00:00.000Z');
        expect(result.durationMinutes).toBe(480); // 8 hours
      });

      it('should return null for empty entries', () => {
        const result = templatesService.calculateDayBoundaries([]);
        expect(result).toBeNull();
      });

      it('should handle single entry', () => {
        const entries = [
          { startTime: '2025-01-15T09:00:00.000Z', endTime: '2025-01-15T12:00:00.000Z' }
        ];

        const result = templatesService.calculateDayBoundaries(entries);

        expect(result.dayStart).toBe('2025-01-15T09:00:00.000Z');
        expect(result.dayEnd).toBe('2025-01-15T12:00:00.000Z');
        expect(result.durationMinutes).toBe(180); // 3 hours
      });
    });

    describe('calculateBlockDuration', () => {
      it('should calculate duration correctly', () => {
        const result = templatesService.calculateBlockDuration(
          '2025-01-15T09:00:00.000Z',
          '2025-01-15T12:00:00.000Z'
        );
        expect(result).toBe(180); // 3 hours = 180 minutes
      });

      it('should handle short durations', () => {
        const result = templatesService.calculateBlockDuration(
          '2025-01-15T09:00:00.000Z',
          '2025-01-15T09:30:00.000Z'
        );
        expect(result).toBe(30);
      });
    });
  });

  // ===========================================
  // applyTemplate Tests (Story 4.9)
  // ===========================================
  describe('applyTemplate', () => {
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
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440501',
          template_id: mockTemplateId,
          start_time: '13:00:00',
          end_time: '17:00:00',
          project_id: null,
          category_id: null,
          description: 'Afternoon work',
          sort_order: 1,
          projects: null,
          categories: null
        }
      ]
    };

    const targetDate = '2025-01-15';

    it('should apply template successfully and create day with blocks', async () => {
      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T17:00:00.000Z',
        duration_minutes: 480,
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
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        },
        {
          id: 'block-2',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: '2025-01-15T13:00:00.000Z',
          end_time: '2025-01-15T17:00:00.000Z',
          duration_minutes: 240,
          project_id: null,
          category_id: null,
          description: 'Afternoon work',
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        callCount++;

        // 1. getById - get template
        if (callCount === 1 && table === 'templates') {
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

        // 2. checkDateHasEntries
        if (callCount === 2 && table === 'time_entries') {
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

        // 3. validateReferences - projects
        if (callCount === 3 && table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        // 4. validateReferences - categories
        if (callCount === 4 && table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        // 5. Create day entry
        if (callCount === 5 && table === 'time_entries') {
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

        // 6. Create blocks
        if (callCount === 6 && table === 'time_entries') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      const result = await templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate);

      expect(result.data.id).toBe('day-uuid');
      expect(result.data.entryMode).toBe('template');
      expect(result.data.blocks).toHaveLength(2);
      expect(result.data.blocks[0].entryMode).toBe('template');
      expect(result.templateId).toBe(mockTemplateId);
      expect(result.templateName).toBe('Morning Routine');
      expect(result.entriesApplied).toBe(2);
    });

    it('should throw NOT_FOUND for non-existent template', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      await expect(
        templatesService.applyTemplate('non-existent', mockUserId, targetDate)
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.applyTemplate('non-existent', mockUserId, targetDate)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND'
      });
    });

    it('should throw FORBIDDEN for template belonging to another user', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockTemplateWithEntries, user_id: mockOtherUserId },
              error: null
            })
          })
        })
      });

      await expect(
        templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate)
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate)
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });
    });

    it('should throw TEMPLATE_EMPTY for template with no entries', async () => {
      const emptyTemplate = {
        ...mockTemplateWithEntries,
        template_entries: []
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: emptyTemplate,
              error: null
            })
          })
        })
      });

      await expect(
        templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate)
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'TEMPLATE_EMPTY'
      });
    });

    it('should throw DATE_HAS_ENTRIES when date already has entries', async () => {
      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        callCount++;

        // 1. getById - get template
        if (callCount === 1 && table === 'templates') {
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

        // 2. checkDateHasEntries - returns existing entries
        if (callCount === 2 && table === 'time_entries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    is: jest.fn().mockResolvedValue({ count: 3, error: null })
                  })
                })
              })
            })
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      try {
        await templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('DATE_HAS_ENTRIES');
        expect(error.data.existingEntriesCount).toBe(3);
      }
    });

    it('should handle archived projects with warnings', async () => {
      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T17:00:00.000Z',
        duration_minutes: 480,
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
        },
        {
          id: 'block-2',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: '2025-01-15T13:00:00.000Z',
          end_time: '2025-01-15T17:00:00.000Z',
          duration_minutes: 240,
          project_id: null,
          category_id: null,
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        callCount++;

        if (callCount === 1 && table === 'templates') {
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

        if (callCount === 2 && table === 'time_entries') {
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
        if (callCount === 3 && table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: true }],
                error: null
              })
            })
          };
        }

        if (callCount === 4 && table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (callCount === 5 && table === 'time_entries') {
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

        if (callCount === 6 && table === 'time_entries') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      const result = await templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('ARCHIVED_PROJECT');
      expect(result.warnings[0].projectId).toBe(mockProjectId);
    });

    it('should handle inactive categories with warnings', async () => {
      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T17:00:00.000Z',
        duration_minutes: 480,
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
          project_id: mockProjectId,
          category_id: null, // Cleared because inactive
          entry_mode: 'template',
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: null
        },
        {
          id: 'block-2',
          user_id: mockUserId,
          parent_id: 'day-uuid',
          start_time: '2025-01-15T13:00:00.000Z',
          end_time: '2025-01-15T17:00:00.000Z',
          duration_minutes: 240,
          project_id: null,
          category_id: null,
          entry_mode: 'template',
          projects: null,
          categories: null
        }
      ];

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        callCount++;

        if (callCount === 1 && table === 'templates') {
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

        if (callCount === 2 && table === 'time_entries') {
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

        if (callCount === 3 && table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        // Category is inactive
        if (callCount === 4 && table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: false }],
                error: null
              })
            })
          };
        }

        if (callCount === 5 && table === 'time_entries') {
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

        if (callCount === 6 && table === 'time_entries') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      const result = await templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('INACTIVE_CATEGORY');
      expect(result.warnings[0].categoryId).toBe(mockCategoryId);
    });

    it('should set entryMode to template for day and all blocks', async () => {
      const mockCreatedDay = {
        id: 'day-uuid',
        user_id: mockUserId,
        start_time: '2025-01-15T09:00:00.000Z',
        end_time: '2025-01-15T17:00:00.000Z',
        duration_minutes: 480,
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

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        callCount++;

        if (callCount === 1 && table === 'templates') {
          const singleEntryTemplate = {
            ...mockTemplateWithEntries,
            template_entries: [mockTemplateWithEntries.template_entries[0]]
          };
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

        if (callCount === 2 && table === 'time_entries') {
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

        if (callCount === 3 && table === 'projects') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockProjectId, is_archived: false }],
                error: null
              })
            })
          };
        }

        if (callCount === 4 && table === 'categories') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ id: mockCategoryId, is_active: true }],
                error: null
              })
            })
          };
        }

        if (callCount === 5 && table === 'time_entries') {
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

        if (callCount === 6 && table === 'time_entries') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockCreatedBlocks,
                error: null
              })
            })
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      const result = await templatesService.applyTemplate(mockTemplateId, mockUserId, targetDate);

      expect(result.data.entryMode).toBe('template');
      expect(result.data.blocks[0].entryMode).toBe('template');
    });
  });

  // ===========================================
  // validateReferences Tests (Story 4.9)
  // ===========================================
  describe('validateReferences', () => {
    it('should return valid entries and empty warnings for active references', async () => {
      const entries = [
        { projectId: mockProjectId, categoryId: mockCategoryId, startTime: '09:00', endTime: '12:00' }
      ];

      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        callCount++;

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

        return {};
      });

      const result = await templatesService.validateReferences(entries);

      expect(result.validEntries).toHaveLength(1);
      expect(result.validEntries[0].projectId).toBe(mockProjectId);
      expect(result.validEntries[0].categoryId).toBe(mockCategoryId);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle entries without project/category IDs', async () => {
      const entries = [
        { projectId: null, categoryId: null, startTime: '09:00', endTime: '12:00' }
      ];

      const result = await templatesService.validateReferences(entries);

      expect(result.validEntries).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ===========================================
  // checkDateHasEntries Tests (Story 4.9)
  // ===========================================
  describe('checkDateHasEntries', () => {
    it('should return hasEntries false when date has no entries', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                is: jest.fn().mockResolvedValue({ count: 0, error: null })
              })
            })
          })
        })
      });

      const result = await templatesService.checkDateHasEntries(mockUserId, '2025-01-15');

      expect(result.hasEntries).toBe(false);
      expect(result.count).toBe(0);
    });

    it('should return hasEntries true with count when date has entries', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                is: jest.fn().mockResolvedValue({ count: 3, error: null })
              })
            })
          })
        })
      });

      const result = await templatesService.checkDateHasEntries(mockUserId, '2025-01-15');

      expect(result.hasEntries).toBe(true);
      expect(result.count).toBe(3);
    });

    it('should throw DATABASE_ERROR on query failure', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                is: jest.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } })
              })
            })
          })
        })
      });

      await expect(
        templatesService.checkDateHasEntries(mockUserId, '2025-01-15')
      ).rejects.toThrow(AppError);
      await expect(
        templatesService.checkDateHasEntries(mockUserId, '2025-01-15')
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'DATABASE_ERROR'
      });
    });
  });
});
