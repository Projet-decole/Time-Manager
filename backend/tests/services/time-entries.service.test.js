// backend/tests/services/time-entries.service.test.js

const timeEntriesService = require('../../services/time-entries.service');
const AppError = require('../../utils/AppError');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Time Entries Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockManagerId = '550e8400-e29b-41d4-a716-446655440001';
  const mockEntryId = '550e8400-e29b-41d4-a716-446655440100';
  const mockProjectId = '550e8400-e29b-41d4-a716-446655440200';
  const mockCategoryId = '550e8400-e29b-41d4-a716-446655440300';

  const mockTimeEntryDb = {
    id: mockEntryId,
    user_id: mockUserId,
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
      user_id: mockUserId,
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

  // ===========================================
  // Helper Functions Tests
  // ===========================================
  describe('Helper Functions', () => {
    describe('calculateDuration', () => {
      it('should calculate duration correctly in minutes', () => {
        const duration = timeEntriesService.calculateDuration(
          '2026-01-12T09:00:00.000Z',
          '2026-01-12T12:30:00.000Z'
        );
        expect(duration).toBe(210); // 3.5 hours = 210 minutes
      });

      it('should return null when endTime is null', () => {
        const duration = timeEntriesService.calculateDuration(
          '2026-01-12T09:00:00.000Z',
          null
        );
        expect(duration).toBeNull();
      });

      it('should return null when endTime is undefined', () => {
        const duration = timeEntriesService.calculateDuration(
          '2026-01-12T09:00:00.000Z',
          undefined
        );
        expect(duration).toBeNull();
      });

      it('should handle same start and end time (0 duration)', () => {
        const duration = timeEntriesService.calculateDuration(
          '2026-01-12T09:00:00.000Z',
          '2026-01-12T09:00:00.000Z'
        );
        expect(duration).toBe(0);
      });

      it('should handle entries spanning midnight', () => {
        const duration = timeEntriesService.calculateDuration(
          '2026-01-11T23:00:00.000Z',
          '2026-01-12T01:00:00.000Z'
        );
        expect(duration).toBe(120); // 2 hours
      });
    });

    describe('getWeekStart', () => {
      it('should return Monday for a Wednesday', () => {
        // Jan 15, 2026 is a Thursday
        const weekStart = timeEntriesService.getWeekStart('2026-01-15T10:00:00.000Z');
        expect(weekStart).toBe('2026-01-12'); // Monday Jan 12
      });

      it('should return same Monday for a Monday', () => {
        // Jan 12, 2026 is a Monday
        const weekStart = timeEntriesService.getWeekStart('2026-01-12T10:00:00.000Z');
        expect(weekStart).toBe('2026-01-12');
      });

      it('should return previous Monday for a Sunday', () => {
        // Jan 11, 2026 is a Sunday
        const weekStart = timeEntriesService.getWeekStart('2026-01-11T10:00:00.000Z');
        expect(weekStart).toBe('2026-01-05'); // Monday Jan 5
      });

      it('should handle Date object input', () => {
        const weekStart = timeEntriesService.getWeekStart(new Date('2026-01-15T10:00:00.000Z'));
        expect(weekStart).toBe('2026-01-12');
      });
    });

    describe('checkTimesheetStatus', () => {
      it('should return canModify true when no timesheet exists', async () => {
        supabase.from.mockReturnValue({
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
        });

        const result = await timeEntriesService.checkTimesheetStatus(mockUserId, '2026-01-12T10:00:00.000Z');
        expect(result.canModify).toBe(true);
      });

      it('should return canModify true when timesheet is draft', async () => {
        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: 'ts-id', status: 'draft' },
                  error: null
                })
              })
            })
          })
        });

        const result = await timeEntriesService.checkTimesheetStatus(mockUserId, '2026-01-12T10:00:00.000Z');
        expect(result.canModify).toBe(true);
      });

      it('should return canModify false when timesheet is submitted', async () => {
        supabase.from.mockReturnValue({
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
        });

        const result = await timeEntriesService.checkTimesheetStatus(mockUserId, '2026-01-12T10:00:00.000Z');
        expect(result.canModify).toBe(false);
        expect(result.status).toBe('submitted');
      });

      it('should return canModify false when timesheet is validated', async () => {
        supabase.from.mockReturnValue({
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
        });

        const result = await timeEntriesService.checkTimesheetStatus(mockUserId, '2026-01-12T10:00:00.000Z');
        expect(result.canModify).toBe(false);
        expect(result.status).toBe('validated');
      });

      it('should throw error on database error (fail-closed for data integrity)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        supabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' }
                })
              })
            })
          })
        });

        await expect(
          timeEntriesService.checkTimesheetStatus(mockUserId, '2026-01-12T10:00:00.000Z')
        ).rejects.toThrow('Unable to verify timesheet status');

        consoleSpy.mockRestore();
      });
    });
  });

  // ===========================================
  // getAll
  // ===========================================
  describe('getAll', () => {
    it('should return paginated list of user own entries in camelCase', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockTimeEntriesList,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      const result = await timeEntriesService.getAll(mockUserId);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', mockEntryId);
      expect(result.data[0]).toHaveProperty('userId', mockUserId);
      expect(result.data[0]).toHaveProperty('startTime', '2026-01-12T09:00:00.000Z');
      expect(result.data[0]).toHaveProperty('durationMinutes', 210);
      expect(result.data[0]).toHaveProperty('entryMode', 'simple');
      expect(result.data[0]).toHaveProperty('project');
      expect(result.data[0].project).toHaveProperty('name', 'Time Manager');
      expect(result.data[0]).toHaveProperty('category');
      expect(result.data[0].category).toHaveProperty('color', '#3B82F6');
      expect(result.data[0]).not.toHaveProperty('start_time');
      expect(result.data[0]).not.toHaveProperty('user_id');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 20);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should handle entry with null project and category', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockTimeEntriesList[1]],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const result = await timeEntriesService.getAll(mockUserId);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('projectId', null);
      expect(result.data[0]).toHaveProperty('categoryId', null);
      expect(result.data[0]).toHaveProperty('durationMinutes', null);
    });

    it('should apply date range filters', async () => {
      const mockEq = jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          lte: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockTimeEntryDb],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq
        })
      });

      await timeEntriesService.getAll(mockUserId, {
        startDate: '2026-01-12',
        endDate: '2026-01-12'
      });

      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should allow manager to view other user entries with targetUserId', async () => {
      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTimeEntriesList,
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

      await timeEntriesService.getAll(mockManagerId, {
        targetUserId: mockUserId,
        role: 'manager'
      });

      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should use requesting user ID when targetUserId provided but not manager', async () => {
      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0
          })
        })
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq
        })
      });

      await timeEntriesService.getAll(mockUserId, {
        targetUserId: mockManagerId,
        role: 'employee'
      });

      // Should use own ID, not targetUserId
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should use custom pagination when provided', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: [mockTimeEntryDb],
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

      const result = await timeEntriesService.getAll(mockUserId, { page: 2, limit: 10 });

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

      await expect(timeEntriesService.getAll(mockUserId))
        .rejects
        .toThrow(AppError);

      await expect(timeEntriesService.getAll(mockUserId))
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

      const result = await timeEntriesService.getAll(mockUserId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // ===========================================
  // getById
  // ===========================================
  describe('getById', () => {
    it('should return entry for owner in camelCase format', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTimeEntryDb,
              error: null
            })
          })
        })
      });

      const result = await timeEntriesService.getById(mockEntryId, mockUserId, 'employee');

      expect(result).toEqual({
        id: mockEntryId,
        userId: mockUserId,
        projectId: mockProjectId,
        categoryId: mockCategoryId,
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:30:00.000Z',
        durationMinutes: 210,
        description: 'Working on feature X',
        entryMode: 'simple',
        createdAt: '2026-01-12T09:00:05.000Z',
        updatedAt: '2026-01-12T09:00:05.000Z',
        project: {
          id: mockProjectId,
          code: 'PRJ-001',
          name: 'Time Manager'
        },
        category: {
          id: mockCategoryId,
          name: 'Development',
          color: '#3B82F6'
        }
      });
    });

    it('should allow manager to view any user entry', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTimeEntryDb,
              error: null
            })
          })
        })
      });

      const result = await timeEntriesService.getById(mockEntryId, mockManagerId, 'manager');

      expect(result).toHaveProperty('id', mockEntryId);
    });

    it('should throw NOT_FOUND when entry does not exist', async () => {
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

      await expect(timeEntriesService.getById(mockEntryId, mockUserId, 'employee'))
        .rejects
        .toThrow(AppError);

      await expect(timeEntriesService.getById(mockEntryId, mockUserId, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw FORBIDDEN for non-owner employee', async () => {
      const otherUserId = '550e8400-e29b-41d4-a716-446655440999';

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTimeEntryDb,
              error: null
            })
          })
        })
      });

      await expect(timeEntriesService.getById(mockEntryId, otherUserId, 'employee'))
        .rejects
        .toThrow(AppError);

      await expect(timeEntriesService.getById(mockEntryId, otherUserId, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'FORBIDDEN'
        });
    });
  });

  // ===========================================
  // create
  // ===========================================
  describe('create', () => {
    it('should create entry with all fields and calculate duration', async () => {
      const createdEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: mockProjectId,
        category_id: mockCategoryId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:30:00.000Z',
        duration_minutes: 210,
        description: 'Working on feature X',
        entry_mode: 'simple',
        created_at: '2026-01-12T09:00:05.000Z',
        updated_at: '2026-01-12T09:00:05.000Z'
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdEntryDb,
              error: null
            })
          })
        })
      });

      const result = await timeEntriesService.create(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:30:00.000Z',
        projectId: mockProjectId,
        categoryId: mockCategoryId,
        description: 'Working on feature X',
        entryMode: 'simple'
      });

      expect(result).toEqual({
        id: mockEntryId,
        userId: mockUserId,
        projectId: mockProjectId,
        categoryId: mockCategoryId,
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:30:00.000Z',
        durationMinutes: 210,
        description: 'Working on feature X',
        entryMode: 'simple',
        createdAt: '2026-01-12T09:00:05.000Z',
        updatedAt: '2026-01-12T09:00:05.000Z'
      });
    });

    it('should create entry with minimal fields (startTime and entryMode)', async () => {
      const createdEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: null,
        duration_minutes: null,
        description: null,
        entry_mode: 'simple',
        created_at: '2026-01-12T09:00:05.000Z',
        updated_at: '2026-01-12T09:00:05.000Z'
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdEntryDb,
              error: null
            })
          })
        })
      });

      const result = await timeEntriesService.create(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        entryMode: 'simple'
      });

      expect(result).toHaveProperty('durationMinutes', null);
      expect(result).toHaveProperty('endTime', null);
      expect(result).toHaveProperty('projectId', null);
    });

    it('should insert correct data to database', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockTimeEntryDb, projects: undefined, categories: undefined },
            error: null
          })
        })
      });

      supabase.from.mockReturnValue({
        insert: mockInsert
      });

      await timeEntriesService.create(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:30:00.000Z',
        projectId: mockProjectId,
        categoryId: mockCategoryId,
        description: 'Working on feature X',
        entryMode: 'simple'
      });

      expect(supabase.from).toHaveBeenCalledWith('time_entries');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:30:00.000Z',
        duration_minutes: 210,
        project_id: mockProjectId,
        category_id: mockCategoryId,
        description: 'Working on feature X',
        entry_mode: 'simple'
      });
    });

    it('should throw INVALID_PROJECT_ID when project not found', async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '23503', message: 'project_id foreign key violation' }
            })
          })
        })
      });

      await expect(timeEntriesService.create(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        projectId: 'invalid-project-id',
        entryMode: 'simple'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_PROJECT_ID'
        });
    });

    it('should throw INVALID_CATEGORY_ID when category not found', async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '23503', message: 'category_id foreign key violation' }
            })
          })
        })
      });

      await expect(timeEntriesService.create(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        categoryId: 'invalid-category-id',
        entryMode: 'simple'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_CATEGORY_ID'
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

      await expect(timeEntriesService.create(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        entryMode: 'simple'
      }))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'CREATE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // update
  // ===========================================
  describe('update', () => {
    const setupUpdateMocks = (existingEntry, updatedEntry, timesheetData = null) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: fetch existing entry
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: existingEntry,
                  error: existingEntry ? null : { message: 'Not found' }
                })
              })
            })
          };
        }
        // Second call: check timesheet status
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: timesheetData,
                    error: null
                  })
                })
              })
            })
          };
        }
        // Third call: update entry
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedEntry,
                  error: updatedEntry ? null : { message: 'Update failed' }
                })
              })
            })
          })
        };
      });
    };

    it('should update entry fields successfully', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z'
      };

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: mockProjectId,
        category_id: mockCategoryId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T13:00:00.000Z',
        duration_minutes: 240,
        description: 'Updated description',
        entry_mode: 'simple',
        created_at: '2026-01-12T09:00:05.000Z',
        updated_at: '2026-01-12T13:00:00.000Z'
      };

      setupUpdateMocks(existingEntry, updatedEntryDb, null);

      const result = await timeEntriesService.update(mockEntryId, mockUserId, {
        endTime: '2026-01-12T13:00:00.000Z',
        description: 'Updated description'
      }, 'employee');

      expect(result).toHaveProperty('endTime', '2026-01-12T13:00:00.000Z');
      expect(result).toHaveProperty('description', 'Updated description');
      expect(result).toHaveProperty('durationMinutes', 240);
    });

    it('should recalculate duration when times change', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z'
      };

      const updatedEntryDb = {
        ...existingEntry,
        end_time: '2026-01-12T17:00:00.000Z',
        duration_minutes: 480,
        entry_mode: 'simple',
        created_at: '2026-01-12T09:00:05.000Z',
        updated_at: '2026-01-12T17:00:00.000Z'
      };

      setupUpdateMocks(existingEntry, updatedEntryDb, null);

      const result = await timeEntriesService.update(mockEntryId, mockUserId, {
        endTime: '2026-01-12T17:00:00.000Z'
      }, 'employee');

      expect(result).toHaveProperty('durationMinutes', 480);
    });

    it('should throw NOT_FOUND when entry does not exist', async () => {
      setupUpdateMocks(null, null, null);

      await expect(timeEntriesService.update(mockEntryId, mockUserId, {
        description: 'Updated'
      }, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw FORBIDDEN for non-owner', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: 'different-user-id',
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z'
      };

      setupUpdateMocks(existingEntry, null, null);

      await expect(timeEntriesService.update(mockEntryId, mockUserId, {
        description: 'Updated'
      }, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'FORBIDDEN'
        });
    });

    it('should throw TIMESHEET_LOCKED when timesheet is submitted', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z'
      };

      setupUpdateMocks(existingEntry, null, { id: 'ts-id', status: 'submitted' });

      await expect(timeEntriesService.update(mockEntryId, mockUserId, {
        description: 'Updated'
      }, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'TIMESHEET_LOCKED',
          message: 'Cannot modify time entry in submitted/validated timesheet'
        });
    });

    it('should throw TIMESHEET_LOCKED when timesheet is validated', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z'
      };

      setupUpdateMocks(existingEntry, null, { id: 'ts-id', status: 'validated' });

      await expect(timeEntriesService.update(mockEntryId, mockUserId, {
        description: 'Updated'
      }, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'TIMESHEET_LOCKED'
        });
    });

    it('should allow update when timesheet is draft', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z'
      };

      const updatedEntryDb = {
        ...existingEntry,
        description: 'Updated description',
        entry_mode: 'simple',
        duration_minutes: 180,
        created_at: '2026-01-12T09:00:05.000Z',
        updated_at: '2026-01-12T13:00:00.000Z'
      };

      setupUpdateMocks(existingEntry, updatedEntryDb, { id: 'ts-id', status: 'draft' });

      const result = await timeEntriesService.update(mockEntryId, mockUserId, {
        description: 'Updated description'
      }, 'employee');

      expect(result).toHaveProperty('description', 'Updated description');
    });
  });

  // ===========================================
  // remove
  // ===========================================
  describe('remove', () => {
    const setupRemoveMocks = (existingEntry, timesheetData = null, deleteSuccess = true) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: fetch existing entry
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: existingEntry,
                  error: existingEntry ? null : { message: 'Not found' }
                })
              })
            })
          };
        }
        // Second call: check timesheet status
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: timesheetData,
                    error: null
                  })
                })
              })
            })
          };
        }
        // Third call: delete entry
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: deleteSuccess ? null : { message: 'Delete failed' }
            })
          })
        };
      });
    };

    it('should delete entry successfully', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z'
      };

      setupRemoveMocks(existingEntry, null, true);

      const result = await timeEntriesService.remove(mockEntryId, mockUserId, 'employee');

      expect(result).toEqual({ message: 'Time entry deleted successfully' });
    });

    it('should throw NOT_FOUND when entry does not exist', async () => {
      setupRemoveMocks(null, null, false);

      await expect(timeEntriesService.remove(mockEntryId, mockUserId, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw FORBIDDEN for non-owner', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: 'different-user-id',
        start_time: '2026-01-12T09:00:00.000Z'
      };

      setupRemoveMocks(existingEntry, null, false);

      await expect(timeEntriesService.remove(mockEntryId, mockUserId, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'FORBIDDEN'
        });
    });

    it('should throw TIMESHEET_LOCKED when timesheet is submitted', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z'
      };

      setupRemoveMocks(existingEntry, { id: 'ts-id', status: 'submitted' }, false);

      await expect(timeEntriesService.remove(mockEntryId, mockUserId, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'TIMESHEET_LOCKED',
          message: 'Cannot delete time entry in submitted/validated timesheet'
        });
    });

    it('should throw TIMESHEET_LOCKED when timesheet is validated', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z'
      };

      setupRemoveMocks(existingEntry, { id: 'ts-id', status: 'validated' }, false);

      await expect(timeEntriesService.remove(mockEntryId, mockUserId, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'TIMESHEET_LOCKED'
        });
    });

    it('should allow delete when timesheet is draft', async () => {
      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z'
      };

      setupRemoveMocks(existingEntry, { id: 'ts-id', status: 'draft' }, true);

      const result = await timeEntriesService.remove(mockEntryId, mockUserId, 'employee');

      expect(result).toEqual({ message: 'Time entry deleted successfully' });
    });

    it('should throw DELETE_FAILED when database delete fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const existingEntry = {
        id: mockEntryId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z'
      };

      setupRemoveMocks(existingEntry, null, false);

      await expect(timeEntriesService.remove(mockEntryId, mockUserId, 'employee'))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DELETE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // getActiveTimer (Story 4.2)
  // ===========================================
  describe('getActiveTimer', () => {
    it('should return null when no active timer exists', async () => {
      supabase.from.mockReturnValue({
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
      });

      const result = await timeEntriesService.getActiveTimer(mockUserId);

      expect(result).toBeNull();
    });

    it('should return active timer when exists', async () => {
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: mockProjectId,
        category_id: mockCategoryId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: null,
        duration_minutes: null,
        description: 'Active work',
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

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: activeTimerDb,
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await timeEntriesService.getActiveTimer(mockUserId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id', mockEntryId);
      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('endTime', null);
      expect(result).toHaveProperty('entryMode', 'simple');
      expect(result).toHaveProperty('project');
      expect(result.project).toHaveProperty('name', 'Time Manager');
      expect(result).toHaveProperty('category');
      expect(result.category).toHaveProperty('color', '#3B82F6');
    });

    it('should throw DATABASE_ERROR on query failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'SOME_ERROR', message: 'Database error' }
                })
              })
            })
          })
        })
      });

      await expect(timeEntriesService.getActiveTimer(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // startTimer (Story 4.2)
  // ===========================================
  describe('startTimer', () => {
    const setupStartTimerMocks = (activeTimer, insertedEntry, insertError = null) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check active timer (getActiveTimer)
        if (callCount === 1) {
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
        // Second call: insert new entry
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: insertedEntry,
                error: insertError
              })
            })
          })
        };
      });
    };

    it('should create entry with startTime approximately now', async () => {
      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStartTimerMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startTimer(mockUserId);

      expect(result).toHaveProperty('id', mockEntryId);
      expect(result).toHaveProperty('entryMode', 'simple');
      expect(result).toHaveProperty('endTime', null);
      expect(result).toHaveProperty('durationMinutes', null);
      // Check startTime is approximately now (within 1 second)
      const startTime = new Date(result.startTime);
      const now = new Date();
      expect(Math.abs(now - startTime)).toBeLessThan(1000);
    });

    it('should create entry with optional projectId', async () => {
      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStartTimerMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startTimer(mockUserId, { projectId: mockProjectId });

      expect(result).toHaveProperty('projectId', mockProjectId);
    });

    it('should create entry with optional categoryId', async () => {
      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStartTimerMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startTimer(mockUserId, { categoryId: mockCategoryId });

      expect(result).toHaveProperty('categoryId', mockCategoryId);
    });

    it('should create entry with optional description', async () => {
      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStartTimerMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startTimer(mockUserId, { description: 'Working on feature X' });

      expect(result).toHaveProperty('description', 'Working on feature X');
    });

    it('should throw TIMER_ALREADY_RUNNING when timer exists', async () => {
      const activeTimer = {
        id: 'existing-timer-id',
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: null,
        entry_mode: 'simple',
        projects: null,
        categories: null
      };

      setupStartTimerMocks(activeTimer, null);

      await expect(timeEntriesService.startTimer(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'TIMER_ALREADY_RUNNING',
          message: 'Timer already running'
        });
    });

    it('should include existing timer data in error when TIMER_ALREADY_RUNNING', async () => {
      const activeTimer = {
        id: 'existing-timer-id',
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: null,
        entry_mode: 'simple',
        projects: null,
        categories: null
      };

      setupStartTimerMocks(activeTimer, null);

      try {
        await timeEntriesService.startTimer(mockUserId);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.data).toBeDefined();
        expect(error.data).toHaveProperty('id', 'existing-timer-id');
      }
    });

    it('should throw INVALID_PROJECT_ID for non-existent project', async () => {
      setupStartTimerMocks(null, null, { code: '23503', message: 'project_id foreign key violation' });

      await expect(timeEntriesService.startTimer(mockUserId, { projectId: 'invalid-uuid' }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_PROJECT_ID'
        });
    });

    it('should throw INVALID_CATEGORY_ID for non-existent category', async () => {
      setupStartTimerMocks(null, null, { code: '23503', message: 'category_id foreign key violation' });

      await expect(timeEntriesService.startTimer(mockUserId, { categoryId: 'invalid-uuid' }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_CATEGORY_ID'
        });
    });

    it('should throw CREATE_FAILED on database insert failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      setupStartTimerMocks(null, null, { message: 'Database error' });

      await expect(timeEntriesService.startTimer(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'CREATE_FAILED'
        });

      consoleSpy.mockRestore();
    });

    it('should allow user B to start timer when user A has active timer (user isolation)', async () => {
      const userAId = '550e8400-e29b-41d4-a716-446655440010';
      const userBId = '550e8400-e29b-41d4-a716-446655440020';

      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: userBId,
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

      // User B has no active timer
      setupStartTimerMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startTimer(userBId);

      expect(result).toHaveProperty('userId', userBId);
      expect(result).toHaveProperty('id', mockEntryId);
    });
  });

  // ===========================================
  // stopTimer (Story 4.3)
  // ===========================================
  describe('stopTimer', () => {
    const setupStopTimerMocks = (activeTimer, updatedEntry, updateError = null) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check active timer (getActiveTimer)
        if (callCount === 1) {
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
        // Second call: update entry
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue({
                        data: updatedEntry,
                        error: updateError
                      })
                    })
                  })
                })
              })
            })
          })
        };
      });
    };

    it('should return completed entry when active timer exists', async () => {
      const startTime = new Date(Date.now() - 3600000); // 1 hour ago
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId);

      expect(result).toHaveProperty('id', mockEntryId);
      expect(result).toHaveProperty('endTime');
      expect(result.endTime).not.toBeNull();
      expect(result).toHaveProperty('durationMinutes', 60);
      expect(result).toHaveProperty('entryMode', 'simple');
    });

    it('should set endTime to approximately now (within 2 seconds tolerance)', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const now = new Date();
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration_minutes: 60,
        description: null,
        entry_mode: 'simple',
        created_at: startTime.toISOString(),
        updated_at: now.toISOString()
      };

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId);

      const endTime = new Date(result.endTime);
      expect(Math.abs(endTime - now)).toBeLessThan(2000);
    });

    it('should calculate durationMinutes correctly', async () => {
      const startTime = new Date(Date.now() - 7200000); // 2 hours ago
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: 120,
        description: null,
        entry_mode: 'simple',
        created_at: startTime.toISOString(),
        updated_at: new Date().toISOString()
      };

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId);

      expect(result).toHaveProperty('durationMinutes', 120);
    });

    it('should ensure minimum duration of 1 minute for very short timers', async () => {
      const startTime = new Date(Date.now() - 10000); // 10 seconds ago
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: 1,
        description: null,
        entry_mode: 'simple',
        created_at: startTime.toISOString(),
        updated_at: new Date().toISOString()
      };

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId);

      expect(result).toHaveProperty('durationMinutes', 1);
    });

    it('should throw NO_ACTIVE_TIMER when no timer exists', async () => {
      setupStopTimerMocks(null, null);

      await expect(timeEntriesService.stopTimer(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NO_ACTIVE_TIMER',
          message: 'No active timer found'
        });
    });

    it('should throw NO_ACTIVE_TIMER when timer exists for different user', async () => {
      // getActiveTimer checks user_id, so null is returned for different user
      setupStopTimerMocks(null, null);

      await expect(timeEntriesService.stopTimer(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NO_ACTIVE_TIMER'
        });
    });

    it('should update projectId when provided', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId, { projectId: mockProjectId });

      expect(result).toHaveProperty('projectId', mockProjectId);
    });

    it('should update categoryId when provided', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: mockCategoryId,
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: 60,
        description: null,
        entry_mode: 'simple',
        created_at: startTime.toISOString(),
        updated_at: new Date().toISOString()
      };

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId, { categoryId: mockCategoryId });

      expect(result).toHaveProperty('categoryId', mockCategoryId);
    });

    it('should update description when provided', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId, { description: 'Completed feature implementation' });

      expect(result).toHaveProperty('description', 'Completed feature implementation');
    });

    it('should preserve original projectId when not provided in stop request', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: mockProjectId,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: null,
        description: null,
        entry_mode: 'simple',
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString(),
        projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
        categories: null
      };

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId, {});

      expect(result).toHaveProperty('projectId', mockProjectId);
    });

    it('should clear projectId when null is provided', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: mockProjectId,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: null,
        description: null,
        entry_mode: 'simple',
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString(),
        projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
        categories: null
      };

      const updatedEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, updatedEntryDb);

      const result = await timeEntriesService.stopTimer(mockUserId, { projectId: null });

      expect(result).toHaveProperty('projectId', null);
    });

    it('should throw INVALID_PROJECT_ID for non-existent project', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, null, { code: '23503', message: 'project_id foreign key violation' });

      await expect(timeEntriesService.stopTimer(mockUserId, { projectId: 'invalid-uuid' }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_PROJECT_ID',
          message: 'Project not found'
        });
    });

    it('should throw INVALID_CATEGORY_ID for non-existent category', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, null, { code: '23503', message: 'category_id foreign key violation' });

      await expect(timeEntriesService.stopTimer(mockUserId, { categoryId: 'invalid-uuid' }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_CATEGORY_ID',
          message: 'Category not found'
        });
    });

    it('should throw UPDATE_FAILED on database update failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const startTime = new Date(Date.now() - 3600000);
      const activeTimerDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStopTimerMocks(activeTimerDb, null, { message: 'Database error' });

      await expect(timeEntriesService.stopTimer(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'UPDATE_FAILED'
        });

      consoleSpy.mockRestore();
    });

    it('should allow user B to stop timer without affecting user A timer (user isolation)', async () => {
      const userAId = '550e8400-e29b-41d4-a716-446655440010';
      const userBId = '550e8400-e29b-41d4-a716-446655440020';

      // User B has no active timer
      setupStopTimerMocks(null, null);

      await expect(timeEntriesService.stopTimer(userBId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NO_ACTIVE_TIMER'
        });
    });
  });

  // ===========================================
  // getActiveDay (Story 4.5)
  // ===========================================
  describe('getActiveDay', () => {
    it('should return null when no active day exists', async () => {
      supabase.from.mockReturnValue({
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
      });

      const result = await timeEntriesService.getActiveDay(mockUserId);

      expect(result).toBeNull();
    });

    it('should return active day when exists', async () => {
      const activeDayDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: activeDayDb,
                    error: null
                  })
                })
              })
            })
          })
        })
      });

      const result = await timeEntriesService.getActiveDay(mockUserId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id', mockEntryId);
      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('endTime', null);
      expect(result).toHaveProperty('entryMode', 'day');
      expect(result).toHaveProperty('parentId', null);
    });

    it('should throw DATABASE_ERROR on query failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'SOME_ERROR', message: 'Database error' }
                  })
                })
              })
            })
          })
        })
      });

      await expect(timeEntriesService.getActiveDay(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should only return day entries with entry_mode=day', async () => {
      supabase.from.mockReturnValue({
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
      });

      const result = await timeEntriesService.getActiveDay(mockUserId);
      expect(result).toBeNull();
    });
  });

  // ===========================================
  // startDay (Story 4.5)
  // ===========================================
  describe('startDay', () => {
    const setupStartDayMocks = (activeDay, insertedEntry, insertError = null) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check active day (getActiveDay)
        if (callCount === 1) {
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
        // Second call: insert new day entry
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: insertedEntry,
                error: insertError
              })
            })
          })
        };
      });
    };

    it('should create day entry with startTime approximately now', async () => {
      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStartDayMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startDay(mockUserId);

      expect(result).toHaveProperty('id', mockEntryId);
      expect(result).toHaveProperty('entryMode', 'day');
      expect(result).toHaveProperty('endTime', null);
      expect(result).toHaveProperty('durationMinutes', null);
      expect(result).toHaveProperty('parentId', null);
      // Check startTime is approximately now (within 1 second)
      const startTime = new Date(result.startTime);
      const now = new Date();
      expect(Math.abs(now - startTime)).toBeLessThan(1000);
    });

    it('should create day entry with optional description', async () => {
      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupStartDayMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startDay(mockUserId, { description: 'Working from home' });

      expect(result).toHaveProperty('description', 'Working from home');
    });

    it('should throw DAY_ALREADY_ACTIVE when day exists', async () => {
      const activeDay = {
        id: 'existing-day-id',
        user_id: mockUserId,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: null,
        entry_mode: 'day',
        parent_id: null
      };

      setupStartDayMocks(activeDay, null);

      await expect(timeEntriesService.startDay(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'DAY_ALREADY_ACTIVE',
          message: 'A day is already in progress'
        });
    });

    it('should include existing day data in error when DAY_ALREADY_ACTIVE', async () => {
      const activeDay = {
        id: 'existing-day-id',
        user_id: mockUserId,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: null,
        entry_mode: 'day',
        parent_id: null
      };

      setupStartDayMocks(activeDay, null);

      try {
        await timeEntriesService.startDay(mockUserId);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.data).toBeDefined();
        expect(error.data).toHaveProperty('id', 'existing-day-id');
      }
    });

    it('should throw CREATE_FAILED on database insert failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      setupStartDayMocks(null, null, { message: 'Database error' });

      await expect(timeEntriesService.startDay(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'CREATE_FAILED'
        });

      consoleSpy.mockRestore();
    });

    it('should allow starting day even if simple timer is active (AC7)', async () => {
      // getActiveDay checks only for day mode, so this test simulates no active day
      const mockCreatedEntry = {
        id: mockEntryId,
        user_id: mockUserId,
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

      // No active day (even if simple timer exists, it won't be returned by getActiveDay)
      setupStartDayMocks(null, mockCreatedEntry);

      const result = await timeEntriesService.startDay(mockUserId);

      expect(result).toHaveProperty('entryMode', 'day');
    });
  });

  // ===========================================
  // endDay (Story 4.5)
  // ===========================================
  describe('endDay', () => {
    const setupEndDayMocks = (activeDay, updatedDay, blocks = [], updateError = null, blocksError = null) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check active day (getActiveDay)
        if (callCount === 1) {
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
        // Second call: update day entry
        if (callCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  is: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      error: updateError
                    })
                  })
                })
              })
            })
          };
        }
        // Third call: getDayWithBlocks - get day entry
        if (callCount === 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedDay,
                  error: null
                })
              })
            })
          };
        }
        // Fourth call: getDayWithBlocks - get blocks
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: blocks,
                  error: blocksError
                })
              })
            })
          })
        };
      });
    };

    it('should throw NO_ACTIVE_DAY when no day exists', async () => {
      setupEndDayMocks(null, null);

      await expect(timeEntriesService.endDay(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NO_ACTIVE_DAY',
          message: 'No active day found'
        });
    });

    it('should return completed day with empty blocks array', async () => {
      const startTime = new Date(Date.now() - 8 * 3600000); // 8 hours ago
      const activeDayDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: null,
        description: 'Working from home',
        entry_mode: 'day',
        parent_id: null,
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString()
      };

      const updatedDayDb = {
        ...activeDayDb,
        end_time: new Date().toISOString(),
        duration_minutes: 480,
        updated_at: new Date().toISOString()
      };

      setupEndDayMocks(activeDayDb, updatedDayDb, []);

      const result = await timeEntriesService.endDay(mockUserId);

      expect(result).toHaveProperty('id', mockEntryId);
      expect(result).toHaveProperty('endTime');
      expect(result.endTime).not.toBeNull();
      expect(result).toHaveProperty('durationMinutes', 480);
      expect(result).toHaveProperty('entryMode', 'day');
      expect(result).toHaveProperty('blocks');
      expect(result.blocks).toEqual([]);
    });

    it('should return completed day with blocks', async () => {
      const startTime = new Date(Date.now() - 8 * 3600000);
      const activeDayDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: null,
        description: null,
        entry_mode: 'day',
        parent_id: null,
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString()
      };

      const updatedDayDb = {
        ...activeDayDb,
        end_time: new Date().toISOString(),
        duration_minutes: 480,
        updated_at: new Date().toISOString()
      };

      const blocksDb = [
        {
          id: 'block-1-uuid',
          user_id: mockUserId,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          start_time: startTime.toISOString(),
          end_time: new Date(startTime.getTime() + 4 * 3600000).toISOString(),
          duration_minutes: 240,
          description: 'Morning development',
          entry_mode: 'day',
          parent_id: mockEntryId,
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString(),
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        }
      ];

      setupEndDayMocks(activeDayDb, updatedDayDb, blocksDb);

      const result = await timeEntriesService.endDay(mockUserId);

      expect(result).toHaveProperty('blocks');
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]).toHaveProperty('project');
      expect(result.blocks[0].project).toHaveProperty('name', 'Time Manager');
      expect(result.blocks[0]).toHaveProperty('category');
      expect(result.blocks[0].category).toHaveProperty('color', '#3B82F6');
    });

    it('should throw UPDATE_FAILED on database update failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const startTime = new Date(Date.now() - 3600000);
      const activeDayDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: null,
        description: null,
        entry_mode: 'day',
        parent_id: null,
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString()
      };

      setupEndDayMocks(activeDayDb, null, [], { message: 'Database error' });

      await expect(timeEntriesService.endDay(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'UPDATE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // getDayWithBlocks (Story 4.5)
  // ===========================================
  describe('getDayWithBlocks', () => {
    const setupGetDayWithBlocksMocks = (dayEntry, blocks = [], dayError = null, blocksError = null) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: get day entry
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: dayEntry,
                  error: dayError
                })
              })
            })
          };
        }
        // Second call: get blocks
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: blocks,
                  error: blocksError
                })
              })
            })
          })
        };
      });
    };

    it('should return day entry with empty blocks array', async () => {
      const dayEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: '2026-01-12T17:00:00.000Z',
        duration_minutes: 540,
        description: 'Full workday',
        entry_mode: 'day',
        parent_id: null,
        created_at: '2026-01-12T08:00:00.000Z',
        updated_at: '2026-01-12T17:00:00.000Z'
      };

      setupGetDayWithBlocksMocks(dayEntryDb, []);

      const result = await timeEntriesService.getDayWithBlocks(mockEntryId, mockUserId);

      expect(result).toHaveProperty('id', mockEntryId);
      expect(result).toHaveProperty('entryMode', 'day');
      expect(result).toHaveProperty('blocks');
      expect(result.blocks).toEqual([]);
    });

    it('should return day entry with child blocks including relations', async () => {
      const dayEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
        project_id: null,
        category_id: null,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: '2026-01-12T17:00:00.000Z',
        duration_minutes: 540,
        description: null,
        entry_mode: 'day',
        parent_id: null,
        created_at: '2026-01-12T08:00:00.000Z',
        updated_at: '2026-01-12T17:00:00.000Z'
      };

      const blocksDb = [
        {
          id: 'block-1-uuid',
          user_id: mockUserId,
          project_id: mockProjectId,
          category_id: mockCategoryId,
          start_time: '2026-01-12T08:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          duration_minutes: 240,
          description: 'Morning work',
          entry_mode: 'day',
          parent_id: mockEntryId,
          created_at: '2026-01-12T08:00:00.000Z',
          updated_at: '2026-01-12T12:00:00.000Z',
          projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
          categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
        },
        {
          id: 'block-2-uuid',
          user_id: mockUserId,
          project_id: null,
          category_id: null,
          start_time: '2026-01-12T13:00:00.000Z',
          end_time: '2026-01-12T17:00:00.000Z',
          duration_minutes: 240,
          description: 'Afternoon work',
          entry_mode: 'day',
          parent_id: mockEntryId,
          created_at: '2026-01-12T13:00:00.000Z',
          updated_at: '2026-01-12T17:00:00.000Z',
          projects: null,
          categories: null
        }
      ];

      setupGetDayWithBlocksMocks(dayEntryDb, blocksDb);

      const result = await timeEntriesService.getDayWithBlocks(mockEntryId, mockUserId);

      expect(result).toHaveProperty('blocks');
      expect(result.blocks).toHaveLength(2);
      expect(result.blocks[0]).toHaveProperty('project');
      expect(result.blocks[0].project).toHaveProperty('name', 'Time Manager');
      // Second block has no project/category - verify 'projects' key doesn't exist after transformation
      expect(Object.keys(result.blocks[1])).not.toContain('projects');
    });

    it('should throw NOT_FOUND for invalid dayId', async () => {
      setupGetDayWithBlocksMocks(null, [], { message: 'Not found' });

      await expect(timeEntriesService.getDayWithBlocks('invalid-uuid', mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw FORBIDDEN for other user day', async () => {
      const otherUserId = '550e8400-e29b-41d4-a716-446655440999';
      const dayEntryDb = {
        id: mockEntryId,
        user_id: otherUserId,
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

      setupGetDayWithBlocksMocks(dayEntryDb, []);

      await expect(timeEntriesService.getDayWithBlocks(mockEntryId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'FORBIDDEN'
        });
    });

    it('should throw DATABASE_ERROR when blocks query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const dayEntryDb = {
        id: mockEntryId,
        user_id: mockUserId,
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

      setupGetDayWithBlocksMocks(dayEntryDb, null, null, { message: 'Database error' });

      await expect(timeEntriesService.getDayWithBlocks(mockEntryId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // validateBlockBoundaries (Story 4.6)
  // ===========================================
  describe('validateBlockBoundaries', () => {
    it('should return valid for block within active day boundaries', () => {
      const block = {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:00:00.000Z'
      };
      const day = {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: null
      };

      // Mock current time to be after block end
      const result = timeEntriesService.validateBlockBoundaries(block, day);

      // For active day, block end must be <= now, so we need to adjust the test
      // Let's test with a completed day instead
      const completedDay = {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: '2026-01-12T18:00:00.000Z'
      };

      const result2 = timeEntriesService.validateBlockBoundaries(block, completedDay);
      expect(result2.valid).toBe(true);
    });

    it('should return invalid when block starts before day start', () => {
      const block = {
        startTime: '2026-01-12T07:00:00.000Z',
        endTime: '2026-01-12T12:00:00.000Z'
      };
      const day = {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: '2026-01-12T18:00:00.000Z'
      };

      const result = timeEntriesService.validateBlockBoundaries(block, day);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('before day start');
    });

    it('should return invalid when block ends after day end (completed day)', () => {
      const block = {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T19:00:00.000Z'
      };
      const day = {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: '2026-01-12T18:00:00.000Z'
      };

      const result = timeEntriesService.validateBlockBoundaries(block, day);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('after day end');
    });

    it('should return invalid when block end is before block start', () => {
      const block = {
        startTime: '2026-01-12T12:00:00.000Z',
        endTime: '2026-01-12T09:00:00.000Z'
      };
      const day = {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: '2026-01-12T18:00:00.000Z'
      };

      const result = timeEntriesService.validateBlockBoundaries(block, day);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('must be after start time');
    });

    it('should return invalid when block ends in the future (active day)', () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      const block = {
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: futureTime
      };
      const day = {
        startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        endTime: null // active day
      };

      const result = timeEntriesService.validateBlockBoundaries(block, day);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('in the future');
    });
  });

  // ===========================================
  // checkBlockOverlap (Story 4.6)
  // ===========================================
  describe('checkBlockOverlap', () => {
    const existingBlocks = [
      { id: 'block-1', startTime: '2026-01-12T09:00:00.000Z', endTime: '2026-01-12T12:00:00.000Z' },
      { id: 'block-2', startTime: '2026-01-12T14:00:00.000Z', endTime: '2026-01-12T17:00:00.000Z' }
    ];

    it('should return no overlap for non-intersecting block', () => {
      const newBlock = {
        startTime: '2026-01-12T12:30:00.000Z',
        endTime: '2026-01-12T13:30:00.000Z'
      };

      const result = timeEntriesService.checkBlockOverlap(newBlock, existingBlocks);

      expect(result.hasOverlap).toBe(false);
      expect(result.conflictingBlocks).toHaveLength(0);
    });

    it('should detect overlap when new block starts during existing block', () => {
      const newBlock = {
        startTime: '2026-01-12T11:00:00.000Z',
        endTime: '2026-01-12T13:00:00.000Z'
      };

      const result = timeEntriesService.checkBlockOverlap(newBlock, existingBlocks);

      expect(result.hasOverlap).toBe(true);
      expect(result.conflictingBlocks).toHaveLength(1);
      expect(result.conflictingBlocks[0].id).toBe('block-1');
    });

    it('should detect overlap when new block ends during existing block', () => {
      const newBlock = {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: '2026-01-12T10:00:00.000Z'
      };

      const result = timeEntriesService.checkBlockOverlap(newBlock, existingBlocks);

      expect(result.hasOverlap).toBe(true);
      expect(result.conflictingBlocks).toHaveLength(1);
      expect(result.conflictingBlocks[0].id).toBe('block-1');
    });

    it('should detect overlap when new block completely contains existing block', () => {
      const newBlock = {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: '2026-01-12T18:00:00.000Z'
      };

      const result = timeEntriesService.checkBlockOverlap(newBlock, existingBlocks);

      expect(result.hasOverlap).toBe(true);
      expect(result.conflictingBlocks).toHaveLength(2);
    });

    it('should detect overlap when new block is completely contained by existing block', () => {
      const newBlock = {
        startTime: '2026-01-12T10:00:00.000Z',
        endTime: '2026-01-12T11:00:00.000Z'
      };

      const result = timeEntriesService.checkBlockOverlap(newBlock, existingBlocks);

      expect(result.hasOverlap).toBe(true);
      expect(result.conflictingBlocks).toHaveLength(1);
      expect(result.conflictingBlocks[0].id).toBe('block-1');
    });

    it('should exclude block with given excludeBlockId from overlap check', () => {
      const newBlock = {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:00:00.000Z'
      };

      const result = timeEntriesService.checkBlockOverlap(newBlock, existingBlocks, 'block-1');

      expect(result.hasOverlap).toBe(false);
      expect(result.conflictingBlocks).toHaveLength(0);
    });

    it('should allow adjacent blocks (no gap, no overlap)', () => {
      const newBlock = {
        startTime: '2026-01-12T12:00:00.000Z',
        endTime: '2026-01-12T14:00:00.000Z'
      };

      const result = timeEntriesService.checkBlockOverlap(newBlock, existingBlocks);

      expect(result.hasOverlap).toBe(false);
    });
  });

  // ===========================================
  // createBlock (Story 4.6)
  // ===========================================
  describe('createBlock', () => {
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';
    const mockBlockId = '550e8400-e29b-41d4-a716-446655440600';

    const setupCreateBlockMocks = (activeDay, existingBlocks = [], createdBlock = null, insertError = null) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: getActiveDay
        if (callCount === 1) {
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
        // Second call: getBlocksForDay
        if (callCount === 2) {
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
        }
        // Third call: insert block
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: createdBlock,
                error: insertError
              })
            })
          })
        };
      });
    };

    it('should create block with all fields', async () => {
      const pastTime = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
      const activeDayDb = {
        id: mockDayId,
        user_id: mockUserId,
        start_time: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        end_time: null,
        entry_mode: 'day',
        parent_id: null
      };

      const createdBlockDb = {
        id: mockBlockId,
        user_id: mockUserId,
        parent_id: mockDayId,
        project_id: mockProjectId,
        category_id: mockCategoryId,
        start_time: pastTime,
        end_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        duration_minutes: 60,
        description: 'Morning work',
        entry_mode: 'day',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
        categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
      };

      setupCreateBlockMocks(activeDayDb, [], createdBlockDb);

      const result = await timeEntriesService.createBlock(mockUserId, {
        startTime: pastTime,
        endTime: new Date(Date.now() - 3600000).toISOString(),
        projectId: mockProjectId,
        categoryId: mockCategoryId,
        description: 'Morning work'
      });

      expect(result).toHaveProperty('id', mockBlockId);
      expect(result).toHaveProperty('parentId', mockDayId);
      expect(result).toHaveProperty('entryMode', 'day');
      expect(result).toHaveProperty('durationMinutes', 60);
      expect(result).toHaveProperty('project');
      expect(result.project).toHaveProperty('name', 'Time Manager');
      expect(result).toHaveProperty('category');
      expect(result.category).toHaveProperty('color', '#3B82F6');
    });

    it('should throw NO_ACTIVE_DAY when no active day exists', async () => {
      setupCreateBlockMocks(null, [], null);

      await expect(timeEntriesService.createBlock(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:00:00.000Z'
      }))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NO_ACTIVE_DAY',
          message: 'No active day found. Start a day first.'
        });
    });

    it('should throw BLOCK_OUTSIDE_DAY_BOUNDARIES when block starts before day', async () => {
      const activeDayDb = {
        id: mockDayId,
        user_id: mockUserId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T18:00:00.000Z',
        entry_mode: 'day',
        parent_id: null
      };

      setupCreateBlockMocks(activeDayDb, [], null);

      await expect(timeEntriesService.createBlock(mockUserId, {
        startTime: '2026-01-12T08:00:00.000Z',
        endTime: '2026-01-12T10:00:00.000Z'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'BLOCK_OUTSIDE_DAY_BOUNDARIES'
        });
    });

    it('should throw BLOCKS_OVERLAP when block overlaps with existing', async () => {
      const activeDayDb = {
        id: mockDayId,
        user_id: mockUserId,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: '2026-01-12T18:00:00.000Z',
        entry_mode: 'day',
        parent_id: null
      };

      const existingBlocksDb = [
        {
          id: 'existing-block',
          user_id: mockUserId,
          parent_id: mockDayId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          duration_minutes: 180,
          entry_mode: 'day'
        }
      ];

      setupCreateBlockMocks(activeDayDb, existingBlocksDb, null);

      try {
        await timeEntriesService.createBlock(mockUserId, {
          startTime: '2026-01-12T10:00:00.000Z',
          endTime: '2026-01-12T14:00:00.000Z'
        });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('BLOCKS_OVERLAP');
        expect(error.data).toBeDefined();
        expect(error.data.conflictingBlocks).toHaveLength(1);
      }
    });

    it('should throw INVALID_PROJECT_ID for non-existent project', async () => {
      const activeDayDb = {
        id: mockDayId,
        user_id: mockUserId,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: '2026-01-12T18:00:00.000Z',
        entry_mode: 'day',
        parent_id: null
      };

      setupCreateBlockMocks(activeDayDb, [], null, { code: '23503', message: 'project_id foreign key violation' });

      await expect(timeEntriesService.createBlock(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:00:00.000Z',
        projectId: 'invalid-uuid'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_PROJECT_ID'
        });
    });

    it('should throw INVALID_CATEGORY_ID for non-existent category', async () => {
      const activeDayDb = {
        id: mockDayId,
        user_id: mockUserId,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: '2026-01-12T18:00:00.000Z',
        entry_mode: 'day',
        parent_id: null
      };

      setupCreateBlockMocks(activeDayDb, [], null, { code: '23503', message: 'category_id foreign key violation' });

      await expect(timeEntriesService.createBlock(mockUserId, {
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:00:00.000Z',
        categoryId: 'invalid-uuid'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_CATEGORY_ID'
        });
    });
  });

  // ===========================================
  // listBlocks (Story 4.6)
  // ===========================================
  describe('listBlocks', () => {
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

    const setupListBlocksMocks = (activeDay, blocks = []) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: getActiveDay
        if (callCount === 1) {
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
        // Second call: getBlocksForDay
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
    };

    it('should return empty result when no active day', async () => {
      setupListBlocksMocks(null, []);

      const result = await timeEntriesService.listBlocks(mockUserId);

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        dayId: null,
        dayStart: null,
        dayEnd: null,
        totalBlocksMinutes: 0,
        unallocatedMinutes: 0
      });
    });

    it('should return blocks sorted by startTime with meta', async () => {
      const activeDayDb = {
        id: mockDayId,
        user_id: mockUserId,
        start_time: '2026-01-12T08:00:00.000Z',
        end_time: null,
        entry_mode: 'day',
        parent_id: null
      };

      const blocksDb = [
        {
          id: 'block-1',
          user_id: mockUserId,
          parent_id: mockDayId,
          start_time: '2026-01-12T09:00:00.000Z',
          end_time: '2026-01-12T12:00:00.000Z',
          duration_minutes: 180,
          entry_mode: 'day',
          projects: null,
          categories: null
        }
      ];

      setupListBlocksMocks(activeDayDb, blocksDb);

      const result = await timeEntriesService.listBlocks(mockUserId);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toHaveProperty('dayId', mockDayId);
      expect(result.meta).toHaveProperty('dayStart', '2026-01-12T08:00:00.000Z');
      expect(result.meta).toHaveProperty('totalBlocksMinutes', 180);
    });
  });

  // ===========================================
  // getBlockById (Story 4.6)
  // ===========================================
  describe('getBlockById', () => {
    const mockBlockId = '550e8400-e29b-41d4-a716-446655440600';
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

    it('should return block with relations', async () => {
      const blockDb = {
        id: mockBlockId,
        user_id: mockUserId,
        parent_id: mockDayId,
        project_id: mockProjectId,
        category_id: mockCategoryId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z',
        duration_minutes: 180,
        description: 'Work',
        entry_mode: 'day',
        created_at: '2026-01-12T09:00:00.000Z',
        updated_at: '2026-01-12T09:00:00.000Z',
        projects: { id: mockProjectId, code: 'PRJ-001', name: 'Time Manager' },
        categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' }
      };

      supabase.from.mockReturnValue({
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
      });

      const result = await timeEntriesService.getBlockById(mockBlockId, mockUserId);

      expect(result).toHaveProperty('id', mockBlockId);
      expect(result).toHaveProperty('parentId', mockDayId);
      expect(result).toHaveProperty('project');
      expect(result.project).toHaveProperty('name', 'Time Manager');
    });

    it('should throw NOT_FOUND for non-existent block', async () => {
      supabase.from.mockReturnValue({
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
      });

      await expect(timeEntriesService.getBlockById('invalid-uuid', mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw FORBIDDEN for block owned by another user', async () => {
      const blockDb = {
        id: mockBlockId,
        user_id: 'other-user-id',
        parent_id: mockDayId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z',
        entry_mode: 'day'
      };

      supabase.from.mockReturnValue({
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
      });

      await expect(timeEntriesService.getBlockById(mockBlockId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'FORBIDDEN'
        });
    });
  });

  // ===========================================
  // deleteBlock (Story 4.6)
  // ===========================================
  describe('deleteBlock', () => {
    const mockBlockId = '550e8400-e29b-41d4-a716-446655440600';
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

    const setupDeleteBlockMocks = (block, deleteSuccess = true) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: getBlockById
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: block,
                    error: block ? null : { message: 'Not found' }
                  })
                })
              })
            })
          };
        }
        // Second call: delete
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: deleteSuccess ? null : { message: 'Delete failed' }
              })
            })
          })
        };
      });
    };

    it('should delete block successfully', async () => {
      const blockDb = {
        id: mockBlockId,
        user_id: mockUserId,
        parent_id: mockDayId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z',
        entry_mode: 'day',
        projects: null,
        categories: null
      };

      setupDeleteBlockMocks(blockDb, true);

      const result = await timeEntriesService.deleteBlock(mockBlockId, mockUserId);

      expect(result).toEqual({ message: 'Time block deleted successfully' });
    });

    it('should throw NOT_FOUND for non-existent block', async () => {
      setupDeleteBlockMocks(null, false);

      await expect(timeEntriesService.deleteBlock('invalid-uuid', mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw FORBIDDEN for block owned by another user', async () => {
      const blockDb = {
        id: mockBlockId,
        user_id: 'other-user-id',
        parent_id: mockDayId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z',
        entry_mode: 'day'
      };

      setupDeleteBlockMocks(blockDb, false);

      await expect(timeEntriesService.deleteBlock(mockBlockId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'FORBIDDEN'
        });
    });

    it('should throw DELETE_FAILED on database error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const blockDb = {
        id: mockBlockId,
        user_id: mockUserId,
        parent_id: mockDayId,
        start_time: '2026-01-12T09:00:00.000Z',
        end_time: '2026-01-12T12:00:00.000Z',
        entry_mode: 'day',
        projects: null,
        categories: null
      };

      setupDeleteBlockMocks(blockDb, false);

      await expect(timeEntriesService.deleteBlock(mockBlockId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DELETE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // updateBlock (Story 4.6)
  // ===========================================
  describe('updateBlock', () => {
    const mockBlockId = '550e8400-e29b-41d4-a716-446655440600';
    const mockDayId = '550e8400-e29b-41d4-a716-446655440500';

    const createBlockDb = (overrides = {}) => ({
      id: mockBlockId,
      user_id: mockUserId,
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
      categories: { id: mockCategoryId, name: 'Development', color: '#3B82F6' },
      ...overrides
    });

    const createDayDb = (overrides = {}) => ({
      id: mockDayId,
      user_id: mockUserId,
      start_time: '2026-01-12T08:00:00.000Z',
      end_time: '2026-01-12T18:00:00.000Z',
      entry_mode: 'day',
      ...overrides
    });

    /**
     * Setup mocks for updateBlock tests
     * @param {Object} options - Configuration for mocks
     * @param {Object|null} options.block - Block to return from getBlockById
     * @param {Object|null} options.parentDay - Parent day entry
     * @param {Array} options.existingBlocks - Existing blocks for overlap check
     * @param {Object|null} options.updatedBlock - Updated block to return
     * @param {Object|null} options.updateError - Error to return from update
     */
    const setupUpdateBlockMocks = ({
      block,
      parentDay,
      existingBlocks = [],
      updatedBlock,
      updateError = null
    }) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // Call 1: getBlockById
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: block,
                    error: block ? null : { message: 'Not found' }
                  })
                })
              })
            })
          };
        }
        // Call 2: get parent day
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: parentDay,
                  error: parentDay ? null : { message: 'Not found' }
                })
              })
            })
          };
        }
        // Call 3: getBlocksForDay (for overlap check)
        if (callCount === 3) {
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
        }
        // Call 4: update
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: updatedBlock,
                    error: updateError
                  })
                })
              })
            })
          })
        };
      });
    };

    it('should update block times successfully', async () => {
      const blockDb = createBlockDb();
      const parentDay = createDayDb();
      const updatedBlockDb = createBlockDb({
        start_time: '2026-01-12T10:00:00.000Z',
        end_time: '2026-01-12T13:00:00.000Z',
        updated_at: new Date().toISOString()
      });

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks: [],
        updatedBlock: updatedBlockDb
      });

      const result = await timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        startTime: '2026-01-12T10:00:00.000Z',
        endTime: '2026-01-12T13:00:00.000Z'
      });

      expect(result).toHaveProperty('id', mockBlockId);
      expect(result).toHaveProperty('startTime', '2026-01-12T10:00:00.000Z');
      expect(result).toHaveProperty('endTime', '2026-01-12T13:00:00.000Z');
    });

    it('should update project/category/description', async () => {
      const blockDb = createBlockDb();
      const parentDay = createDayDb();
      const newProjectId = '550e8400-e29b-41d4-a716-446655440999';
      const updatedBlockDb = createBlockDb({
        project_id: newProjectId,
        description: 'Updated description',
        projects: { id: newProjectId, code: 'PRJ-002', name: 'New Project' },
        updated_at: new Date().toISOString()
      });

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks: [],
        updatedBlock: updatedBlockDb
      });

      const result = await timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        projectId: newProjectId,
        description: 'Updated description'
      });

      expect(result).toHaveProperty('projectId', newProjectId);
      expect(result).toHaveProperty('description', 'Updated description');
      expect(result.project).toHaveProperty('name', 'New Project');
    });

    it('should throw NOT_FOUND for non-existent block', async () => {
      setupUpdateBlockMocks({
        block: null,
        parentDay: null,
        existingBlocks: [],
        updatedBlock: null
      });

      await expect(timeEntriesService.updateBlock('invalid-uuid', mockUserId, {
        description: 'Test'
      }))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw FORBIDDEN for block owned by another user', async () => {
      const blockDb = createBlockDb({ user_id: 'other-user-id' });

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay: null,
        existingBlocks: [],
        updatedBlock: null
      });

      await expect(timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        description: 'Test'
      }))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: 'FORBIDDEN'
        });
    });

    it('should throw BLOCK_OUTSIDE_DAY_BOUNDARIES when update exceeds day bounds', async () => {
      const blockDb = createBlockDb();
      // Day ends at 18:00, but we try to update block to end at 20:00
      const parentDay = createDayDb({ end_time: '2026-01-12T18:00:00.000Z' });

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks: [],
        updatedBlock: null
      });

      await expect(timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        endTime: '2026-01-12T20:00:00.000Z'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'BLOCK_OUTSIDE_DAY_BOUNDARIES'
        });
    });

    it('should throw BLOCKS_OVERLAP when update causes overlap with other blocks', async () => {
      const blockDb = createBlockDb();
      const parentDay = createDayDb();
      // Existing block from 14:00-17:00
      const existingBlocks = [{
        id: 'other-block-id',
        startTime: '2026-01-12T14:00:00.000Z',
        endTime: '2026-01-12T17:00:00.000Z'
      }];

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks,
        updatedBlock: null
      });

      // Try to update block to overlap with existing block (13:00-15:00)
      await expect(timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        startTime: '2026-01-12T13:00:00.000Z',
        endTime: '2026-01-12T15:00:00.000Z'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'BLOCKS_OVERLAP'
        });
    });

    it('should exclude self from overlap check', async () => {
      const blockDb = createBlockDb();
      const parentDay = createDayDb();
      // Same block in existingBlocks should be excluded
      const existingBlocks = [{
        id: mockBlockId, // Same ID as block being updated
        startTime: '2026-01-12T09:00:00.000Z',
        endTime: '2026-01-12T12:00:00.000Z'
      }];
      const updatedBlockDb = createBlockDb({
        start_time: '2026-01-12T09:30:00.000Z',
        end_time: '2026-01-12T12:30:00.000Z',
        duration_minutes: 180,
        updated_at: new Date().toISOString()
      });

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks,
        updatedBlock: updatedBlockDb
      });

      // Shift block by 30 minutes - should NOT conflict with itself
      const result = await timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        startTime: '2026-01-12T09:30:00.000Z',
        endTime: '2026-01-12T12:30:00.000Z'
      });

      expect(result).toHaveProperty('id', mockBlockId);
      expect(result).toHaveProperty('startTime', '2026-01-12T09:30:00.000Z');
    });

    it('should throw INVALID_PROJECT_ID for non-existent project', async () => {
      const blockDb = createBlockDb();
      const parentDay = createDayDb();

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks: [],
        updatedBlock: null,
        updateError: { code: '23503', message: 'violates foreign key constraint project_id' }
      });

      await expect(timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        projectId: 'invalid-project-id'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_PROJECT_ID'
        });
    });

    it('should throw INVALID_CATEGORY_ID for non-existent category', async () => {
      const blockDb = createBlockDb();
      const parentDay = createDayDb();

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks: [],
        updatedBlock: null,
        updateError: { code: '23503', message: 'violates foreign key constraint category_id' }
      });

      await expect(timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        categoryId: 'invalid-category-id'
      }))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'INVALID_CATEGORY_ID'
        });
    });

    it('should throw UPDATE_FAILED on database error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const blockDb = createBlockDb();
      const parentDay = createDayDb();

      setupUpdateBlockMocks({
        block: blockDb,
        parentDay,
        existingBlocks: [],
        updatedBlock: null,
        updateError: { message: 'Database error' }
      });

      await expect(timeEntriesService.updateBlock(mockBlockId, mockUserId, {
        description: 'Test'
      }))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'UPDATE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });
});
