// backend/tests/services/projects.service.test.js

const projectsService = require('../../services/projects.service');
const AppError = require('../../utils/AppError');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Projects Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProjectId = '550e8400-e29b-41d4-a716-446655440000';

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
    time_entries: [
      { duration_minutes: 120 },
      { duration_minutes: 60 }
    ],
    team_projects: [
      {
        teams: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Engineering'
        }
      },
      {
        teams: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Design'
        }
      }
    ]
  };

  describe('generateNextCode', () => {
    it('should generate PRJ-001 when no projects exist', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      const result = await projectsService.generateNextCode();

      expect(result).toBe('PRJ-001');
    });

    it('should generate next sequential code after existing projects', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ code: 'PRJ-005' }, { code: 'PRJ-002' }, { code: 'PRJ-001' }],
          error: null
        })
      });

      const result = await projectsService.generateNextCode();

      expect(result).toBe('PRJ-006');
    });

    it('should handle codes with larger numbers correctly (numeric sort)', async () => {
      // This test verifies the fix for alphabetical sorting bug
      // PRJ-1000 should be recognized as larger than PRJ-999
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            { code: 'PRJ-999' },
            { code: 'PRJ-1000' },
            { code: 'PRJ-100' }
          ],
          error: null
        })
      });

      const result = await projectsService.generateNextCode();

      expect(result).toBe('PRJ-1001');
    });

    it('should find max from scattered code numbers', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            { code: 'PRJ-001' },
            { code: 'PRJ-050' },
            { code: 'PRJ-025' },
            { code: 'PRJ-100' }
          ],
          error: null
        })
      });

      const result = await projectsService.generateNextCode();

      expect(result).toBe('PRJ-101');
    });

    it('should throw CODE_GENERATION_FAILED when database query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      await expect(projectsService.generateNextCode())
        .rejects
        .toThrow(AppError);

      await expect(projectsService.generateNextCode())
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'CODE_GENERATION_FAILED'
        });

      consoleSpy.mockRestore();
    });

    it('should ignore malformed codes', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            { code: 'PRJ-005' },
            { code: 'INVALID' },
            { code: null },
            { code: 'PRJ-abc' }
          ],
          error: null
        })
      });

      const result = await projectsService.generateNextCode();

      expect(result).toBe('PRJ-006');
    });
  });

  describe('getAll', () => {
    it('should return paginated list of active projects by default', async () => {
      const mockProjectsWithEntries = [
        { ...mockProjectDb, time_entries: [{ duration_minutes: 120 }] },
        {
          id: '550e8400-e29b-41d4-a716-446655440099',
          code: 'PRJ-002',
          name: 'Marketing',
          description: 'Marketing project',
          budget_hours: 100,
          status: 'active',
          created_at: '2026-01-02T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
          time_entries: [{ duration_minutes: 60 }]
        }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockProjectsWithEntries,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      const result = await projectsService.getAll();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', mockProjectId);
      expect(result.data[0]).toHaveProperty('name', 'Time Manager');
      expect(result.data[0]).toHaveProperty('code', 'PRJ-001');
      expect(result.data[0]).toHaveProperty('budgetHours', 500);
      expect(result.data[0]).toHaveProperty('totalHoursTracked', 2); // 120 minutes = 2 hours
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).not.toHaveProperty('time_entries');
      expect(result.data[0]).not.toHaveProperty('created_at');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 20);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should include archived projects when includeArchived is true', async () => {
      const mockArchivedProject = {
        ...mockProjectDb,
        id: '550e8400-e29b-41d4-a716-446655440098',
        status: 'archived',
        time_entries: []
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [{ ...mockProjectDb, time_entries: [] }, mockArchivedProject],
              error: null,
              count: 2
            })
          })
        })
      });

      const result = await projectsService.getAll({ includeArchived: true });

      expect(result.data).toHaveLength(2);
      expect(result.data.some(p => p.status === 'archived')).toBe(true);
    });

    it('should calculate totalHoursTracked correctly', async () => {
      const mockProjectWithTime = {
        ...mockProjectDb,
        time_entries: [
          { duration_minutes: 90 },  // 1.5 hours
          { duration_minutes: 30 }   // 0.5 hours
        ]
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockProjectWithTime],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const result = await projectsService.getAll();

      expect(result.data[0].totalHoursTracked).toBe(2); // 120 minutes = 2 hours
    });

    it('should handle empty time_entries array', async () => {
      const mockProjectNoTime = {
        ...mockProjectDb,
        time_entries: []
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [mockProjectNoTime],
                error: null,
                count: 1
              })
            })
          })
        })
      });

      const result = await projectsService.getAll();

      expect(result.data[0].totalHoursTracked).toBe(0);
    });

    it('should use custom pagination when provided', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: [{ ...mockProjectDb, time_entries: [] }],
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

      const result = await projectsService.getAll({ page: 2, limit: 10 });

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

      await expect(projectsService.getAll())
        .rejects
        .toThrow(AppError);

      await expect(projectsService.getAll())
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
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

      const result = await projectsService.getAll();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return project in camelCase format with teams and hours tracked', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProjectWithRelations,
              error: null
            })
          })
        })
      });

      const result = await projectsService.getById(mockProjectId);

      expect(result).toEqual({
        id: mockProjectId,
        code: 'PRJ-001',
        name: 'Time Manager',
        description: 'Main project',
        budgetHours: 500,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        totalHoursTracked: 3, // 180 minutes = 3 hours
        teams: [
          { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Engineering' },
          { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Design' }
        ]
      });
    });

    it('should throw NOT_FOUND when project does not exist', async () => {
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

      await expect(projectsService.getById(mockProjectId))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.getById(mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should handle project with no teams and no time entries', async () => {
      const projectNoRelations = {
        ...mockProjectDb,
        time_entries: [],
        team_projects: []
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: projectNoRelations,
              error: null
            })
          })
        })
      });

      const result = await projectsService.getById(mockProjectId);

      expect(result.teams).toEqual([]);
      expect(result.totalHoursTracked).toBe(0);
    });

    it('should filter out null teams in team_projects', async () => {
      const projectWithNullTeam = {
        ...mockProjectDb,
        time_entries: [],
        team_projects: [
          { teams: null },
          {
            teams: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Engineering'
            }
          }
        ]
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: projectWithNullTeam,
              error: null
            })
          })
        })
      });

      const result = await projectsService.getById(mockProjectId);

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0]).toHaveProperty('name', 'Engineering');
    });
  });

  describe('create', () => {
    it('should create project successfully with auto-generated code', async () => {
      // Mock for generateNextCode
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [{ code: 'PRJ-002' }],
          error: null
        })
      });

      // Mock for insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockProjectDb, code: 'PRJ-003' },
              error: null
            })
          })
        })
      });

      const result = await projectsService.create({
        name: 'Time Manager',
        description: 'Main project',
        budgetHours: 500
      });

      expect(result).toEqual({
        id: mockProjectId,
        code: 'PRJ-003',
        name: 'Time Manager',
        description: 'Main project',
        budgetHours: 500,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should create project without optional fields', async () => {
      const projectNoOptional = { ...mockProjectDb, description: null, budget_hours: null };

      // Mock for generateNextCode
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      // Mock for insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: projectNoOptional,
              error: null
            })
          })
        })
      });

      const result = await projectsService.create({ name: 'Time Manager' });

      expect(result).toHaveProperty('description', null);
      expect(result).toHaveProperty('budgetHours', null);
    });

    it('should retry on race condition (duplicate code) and succeed', async () => {
      let insertCallCount = 0;

      // Mock generateNextCode - will be called multiple times
      supabase.from.mockImplementation(() => {
        return {
          // For generateNextCode
          select: jest.fn().mockResolvedValue({
            data: [{ code: 'PRJ-001' }],
            error: null
          }),
          // For insert
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockImplementation(() => {
                insertCallCount++;
                if (insertCallCount === 1) {
                  // First attempt: duplicate error (race condition)
                  return Promise.resolve({
                    data: null,
                    error: { code: '23505', message: 'duplicate key value' }
                  });
                }
                // Second attempt: success
                return Promise.resolve({
                  data: { ...mockProjectDb, code: 'PRJ-002' },
                  error: null
                });
              })
            })
          })
        };
      });

      const result = await projectsService.create({ name: 'Test Project' });

      expect(result).toHaveProperty('code', 'PRJ-002');
      expect(insertCallCount).toBeGreaterThanOrEqual(2);
    });

    it('should throw DUPLICATE_CODE after max retries exhausted', async () => {
      // Mock that always returns duplicate error
      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null
          }),
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

      await expect(projectsService.create({ name: 'Test' }))
        .rejects
        .toMatchObject({
          statusCode: 409,
          code: 'DUPLICATE_CODE',
          message: 'Failed to generate unique project code after retries'
        });
    });

    it('should throw CREATE_FAILED when database insert fails with non-duplicate error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock for generateNextCode
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      // Mock for insert - generic error (not duplicate)
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      await expect(projectsService.create({ name: 'Test' }))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'CREATE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should update project successfully and return in camelCase', async () => {
      const updatedProjectDb = {
        ...mockProjectDb,
        name: 'Updated Time Manager',
        description: 'Updated description'
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedProjectDb,
                error: null
              })
            })
          })
        })
      });

      const result = await projectsService.update(mockProjectId, {
        name: 'Updated Time Manager',
        description: 'Updated description'
      });

      expect(result).toEqual({
        id: mockProjectId,
        code: 'PRJ-001',
        name: 'Updated Time Manager',
        description: 'Updated description',
        budgetHours: 500,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should throw NOT_FOUND when project does not exist', async () => {
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

      await expect(projectsService.update(mockProjectId, { name: 'Updated' }))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.update(mockProjectId, { name: 'Updated' }))
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

      await expect(projectsService.update(mockProjectId, { name: 'Updated' }))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
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

      await expect(projectsService.update(mockProjectId, { name: 'Updated' }))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.update(mockProjectId, { name: 'Updated' }))
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
              data: mockProjectDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      await projectsService.update(mockProjectId, { name: 'Updated' });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(typeof updateCall.updated_at).toBe('string');
    });

    it('should filter out non-allowed fields including code', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProjectDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      await projectsService.update(mockProjectId, {
        name: 'Updated',
        code: 'PRJ-999', // Should be filtered out - code is immutable
        createdAt: '2025-01-01T00:00:00.000Z', // Should be filtered out
        id: 'new-id' // Should be filtered out
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('name', 'Updated');
      expect(updateCall).not.toHaveProperty('code');
      expect(updateCall).not.toHaveProperty('id');
      expect(updateCall).not.toHaveProperty('created_at');
    });
  });

  describe('archive', () => {
    it('should archive project successfully', async () => {
      const archivedProject = { ...mockProjectDb, status: 'archived' };

      supabase.from.mockReturnValue({
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

      const result = await projectsService.archive(mockProjectId);

      expect(result).toHaveProperty('status', 'archived');
    });

    it('should throw NOT_FOUND when project does not exist', async () => {
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

      await expect(projectsService.archive(mockProjectId))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.archive(mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw ARCHIVE_FAILED when database update fails', async () => {
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

      await expect(projectsService.archive(mockProjectId))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.archive(mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'ARCHIVE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  describe('restore', () => {
    it('should restore project successfully', async () => {
      const restoredProject = { ...mockProjectDb, status: 'active' };

      supabase.from.mockReturnValue({
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

      const result = await projectsService.restore(mockProjectId);

      expect(result).toHaveProperty('status', 'active');
    });

    it('should throw NOT_FOUND when project does not exist', async () => {
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

      await expect(projectsService.restore(mockProjectId))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.restore(mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw RESTORE_FAILED when database update fails', async () => {
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

      await expect(projectsService.restore(mockProjectId))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.restore(mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'RESTORE_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // Story 3.4: Team-Project Assignment API Tests
  // ===========================================

  const mockUserId = '550e8400-e29b-41d4-a716-446655440005';
  const mockTeamId = '550e8400-e29b-41d4-a716-446655440006';

  describe('getProjectsForUserTeams', () => {
    it('should return projects for user teams', async () => {
      const mockMemberships = [
        { team_id: mockTeamId },
        { team_id: '550e8400-e29b-41d4-a716-446655440007' }
      ];

      const mockTeamProjects = [
        { project_id: mockProjectId },
        { project_id: '550e8400-e29b-41d4-a716-446655440008' }
      ];

      const mockProjectsData = [
        { ...mockProjectDb, time_entries: [{ duration_minutes: 120 }] },
        {
          id: '550e8400-e29b-41d4-a716-446655440008',
          code: 'PRJ-002',
          name: 'Marketing App',
          description: 'Marketing project',
          budget_hours: 200,
          status: 'active',
          created_at: '2026-01-02T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
          time_entries: [{ duration_minutes: 60 }]
        }
      ];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: get user's team memberships
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockMemberships,
                error: null
              })
            })
          };
        }
        // Second call: get team projects
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockTeamProjects,
                error: null
              })
            })
          };
        }
        // Third call: get projects
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: mockProjectsData,
                    error: null,
                    count: 2
                  })
                })
              })
            })
          })
        };
      });

      const result = await projectsService.getProjectsForUserTeams(mockUserId);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', mockProjectId);
      expect(result.data[0]).toHaveProperty('totalHoursTracked', 2);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should return empty result when user is not in any teams', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await projectsService.getProjectsForUserTeams(mockUserId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should return empty result when no projects assigned to user teams', async () => {
      const mockMemberships = [{ team_id: mockTeamId }];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockMemberships,
                error: null
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        };
      });

      const result = await projectsService.getProjectsForUserTeams(mockUserId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw DATABASE_ERROR when getting user teams fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      await expect(projectsService.getProjectsForUserTeams(mockUserId))
        .rejects
        .toThrow(AppError);

      await expect(projectsService.getProjectsForUserTeams(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should throw DATABASE_ERROR when getting team projects fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockMemberships = [{ team_id: mockTeamId }];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockMemberships,
                error: null
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        };
      });

      await expect(projectsService.getProjectsForUserTeams(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should throw DATABASE_ERROR when getting projects fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockMemberships = [{ team_id: mockTeamId }];
      const mockTeamProjects = [{ project_id: mockProjectId }];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockMemberships,
                error: null
              })
            })
          };
        }
        if (callCount === 2) {
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
                    data: null,
                    error: { message: 'Database error' },
                    count: null
                  })
                })
              })
            })
          })
        };
      });

      await expect(projectsService.getProjectsForUserTeams(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should handle duplicate project IDs from multiple teams', async () => {
      // Same project assigned to multiple teams the user is in
      const mockMemberships = [
        { team_id: mockTeamId },
        { team_id: '550e8400-e29b-41d4-a716-446655440007' }
      ];

      const mockTeamProjects = [
        { project_id: mockProjectId },
        { project_id: mockProjectId } // Duplicate
      ];

      const mockProjectsData = [
        { ...mockProjectDb, time_entries: [] }
      ];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockMemberships,
                error: null
              })
            })
          };
        }
        if (callCount === 2) {
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
                    data: mockProjectsData,
                    error: null,
                    count: 1
                  })
                })
              })
            })
          })
        };
      });

      const result = await projectsService.getProjectsForUserTeams(mockUserId);

      expect(result.data).toHaveLength(1);
    });
  });
});
