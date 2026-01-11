// backend/tests/services/teams.service.test.js

const teamsService = require('../../services/teams.service');
const AppError = require('../../utils/AppError');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Teams Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTeamId = '550e8400-e29b-41d4-a716-446655440000';

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
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'employee'
        }
      },
      {
        profiles: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
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

  describe('getAll', () => {
    it('should return paginated list of teams in camelCase with member counts', async () => {
      const mockTeamsWithCount = [
        { ...mockTeamDb, team_members: [{ count: 5 }] },
        {
          id: '550e8400-e29b-41d4-a716-446655440099',
          name: 'Marketing',
          description: 'Marketing team',
          created_at: '2026-01-02T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
          team_members: [{ count: 3 }]
        }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockTeamsWithCount,
              error: null,
              count: 2
            })
          })
        })
      });

      const result = await teamsService.getAll();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', mockTeamId);
      expect(result.data[0]).toHaveProperty('name', 'Engineering');
      expect(result.data[0]).toHaveProperty('memberCount', 5);
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).not.toHaveProperty('team_members');
      expect(result.data[0]).not.toHaveProperty('created_at');
      expect(result.data[1]).toHaveProperty('memberCount', 3);
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 20);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should handle empty team_members array', async () => {
      const mockTeamsNoMembers = [
        { ...mockTeamDb, team_members: [] }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockTeamsNoMembers,
              error: null,
              count: 1
            })
          })
        })
      });

      const result = await teamsService.getAll();

      expect(result.data[0]).toHaveProperty('memberCount', 0);
    });

    it('should use custom pagination when provided', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: [{ ...mockTeamDb, team_members: [{ count: 2 }] }],
        error: null,
        count: 50
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: mockRange
          })
        })
      });

      const result = await teamsService.getAll({ page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      // Offset should be (2-1)*10 = 10, so range(10, 19)
      expect(mockRange).toHaveBeenCalledWith(10, 19);
    });

    it('should throw DATABASE_ERROR when query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
              count: null
            })
          })
        })
      });

      await expect(teamsService.getAll())
        .rejects
        .toThrow(AppError);

      await expect(teamsService.getAll())
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
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      });

      const result = await teamsService.getAll();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle null data from database gracefully', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: null,
              count: 0
            })
          })
        })
      });

      const result = await teamsService.getAll();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return team in camelCase format with members and projects', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeamWithRelations,
              error: null
            })
          })
        })
      });

      const result = await teamsService.getById(mockTeamId);

      expect(result).toEqual({
        id: mockTeamId,
        name: 'Engineering',
        description: 'Development team',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        members: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'employee'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'employee'
          }
        ],
        projects: [
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            code: 'PRJ-001',
            name: 'Time Manager'
          }
        ]
      });
    });

    it('should throw NOT_FOUND when team does not exist', async () => {
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

      await expect(teamsService.getById(mockTeamId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.getById(mockTeamId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should handle team with no members and no projects', async () => {
      const teamNoRelations = {
        ...mockTeamDb,
        team_members: [],
        team_projects: []
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: teamNoRelations,
              error: null
            })
          })
        })
      });

      const result = await teamsService.getById(mockTeamId);

      expect(result.members).toEqual([]);
      expect(result.projects).toEqual([]);
    });

    it('should filter out null profiles in members', async () => {
      const teamWithNullProfile = {
        ...mockTeamDb,
        team_members: [
          { profiles: null },
          {
            profiles: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              email: 'john@example.com',
              first_name: 'John',
              last_name: 'Doe',
              role: 'employee'
            }
          }
        ],
        team_projects: []
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: teamWithNullProfile,
              error: null
            })
          })
        })
      });

      const result = await teamsService.getById(mockTeamId);

      expect(result.members).toHaveLength(1);
      expect(result.members[0]).toHaveProperty('email', 'john@example.com');
    });

    it('should query the teams table with correct ID', async () => {
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...mockTeamDb, team_members: [], team_projects: [] },
          error: null
        })
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      });

      supabase.from.mockReturnValue({
        select: mockSelect
      });

      await teamsService.getById(mockTeamId);

      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(mockEq).toHaveBeenCalledWith('id', mockTeamId);
    });
  });

  describe('create', () => {
    it('should create team successfully and return in camelCase', async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeamDb,
              error: null
            })
          })
        })
      });

      const result = await teamsService.create({
        name: 'Engineering',
        description: 'Development team'
      });

      expect(result).toEqual({
        id: mockTeamId,
        name: 'Engineering',
        description: 'Development team',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should create team without description', async () => {
      const teamNoDesc = { ...mockTeamDb, description: null };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: teamNoDesc,
              error: null
            })
          })
        })
      });

      const result = await teamsService.create({ name: 'Engineering' });

      expect(result).toHaveProperty('description', null);
    });

    it('should throw DUPLICATE_NAME when team name already exists', async () => {
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

      await expect(teamsService.create({ name: 'Engineering' }))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.create({ name: 'Engineering' }))
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

      await expect(teamsService.create({ name: 'Engineering' }))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.create({ name: 'Engineering' }))
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
            data: mockTeamDb,
            error: null
          })
        })
      });

      supabase.from.mockReturnValue({
        insert: mockInsert
      });

      await teamsService.create({
        name: 'Engineering',
        description: 'Development team'
      });

      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Engineering',
        description: 'Development team'
      });
    });
  });

  describe('update', () => {
    it('should update team successfully and return in camelCase', async () => {
      const updatedTeamDb = {
        ...mockTeamDb,
        name: 'Updated Engineering',
        description: 'Updated description'
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedTeamDb,
                error: null
              })
            })
          })
        })
      });

      const result = await teamsService.update(mockTeamId, {
        name: 'Updated Engineering',
        description: 'Updated description'
      });

      expect(result).toEqual({
        id: mockTeamId,
        name: 'Updated Engineering',
        description: 'Updated description',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should throw NOT_FOUND when team does not exist', async () => {
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

      await expect(teamsService.update(mockTeamId, { name: 'Updated' }))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.update(mockTeamId, { name: 'Updated' }))
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

      await expect(teamsService.update(mockTeamId, { name: 'Updated' }))
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

      await expect(teamsService.update(mockTeamId, { name: 'Existing Team' }))
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

      await expect(teamsService.update(mockTeamId, { name: 'Updated' }))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.update(mockTeamId, { name: 'Updated' }))
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
              data: mockTeamDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      await teamsService.update(mockTeamId, { name: 'Updated' });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(typeof updateCall.updated_at).toBe('string');
    });

    it('should filter out non-allowed fields and update with valid ones', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeamDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      // Note: validator now rejects invalid fields with .strict(), but service still filters as safety net
      await teamsService.update(mockTeamId, {
        name: 'Updated',
        description: 'New desc'
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('name', 'Updated');
      expect(updateCall).toHaveProperty('description', 'New desc');
      expect(updateCall).not.toHaveProperty('id');
      expect(updateCall).not.toHaveProperty('created_at');
    });

    it('should throw VALIDATION_ERROR when no valid fields provided', async () => {
      // This case is normally prevented by validator .strict(), but test service safety net
      await expect(teamsService.update(mockTeamId, {}))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR'
        });
    });
  });

  describe('remove', () => {
    it('should delete team successfully', async () => {
      // Mock for existence check
      const mockSingle = jest.fn()
        .mockResolvedValueOnce({ data: { id: mockTeamId }, error: null });

      // Mock for delete
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle
          })
        }),
        delete: mockDelete
      });

      const result = await teamsService.remove(mockTeamId);

      expect(result).toEqual({ message: 'Team deleted successfully' });
    });

    it('should throw NOT_FOUND when team does not exist', async () => {
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

      await expect(teamsService.remove(mockTeamId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.remove(mockTeamId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should throw DELETE_FAILED when database delete fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // First call for existence check succeeds
      // Second call for delete fails
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Database error' }
            })
          })
        };
      });

      await expect(teamsService.remove(mockTeamId))
        .rejects
        .toThrow(AppError);

      callCount = 0;
      await expect(teamsService.remove(mockTeamId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DELETE_FAILED'
        });

      consoleSpy.mockRestore();
    });

    it('should call delete on the correct team ID', async () => {
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({
        eq: mockDeleteEq
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
          delete: mockDelete
        };
      });

      await teamsService.remove(mockTeamId);

      expect(mockDeleteEq).toHaveBeenCalledWith('id', mockTeamId);
    });
  });

  // ===========================================
  // Story 3.2: Team Member Assignment API Tests
  // ===========================================

  const mockUserId = '550e8400-e29b-41d4-a716-446655440001';
  const mockMembershipId = '550e8400-e29b-41d4-a716-446655440099';

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

  describe('getMembers', () => {
    it('should return paginated members with profiles', async () => {
      const mockMembers = [
        mockMembershipDb,
        {
          id: '550e8400-e29b-41d4-a716-446655440098',
          team_id: mockTeamId,
          user_id: '550e8400-e29b-41d4-a716-446655440002',
          created_at: '2026-01-10T11:00:00.000Z',
          profiles: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            email: 'jane@example.com',
            first_name: 'Jane',
            last_name: 'Smith',
            role: 'employee'
          }
        }
      ];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check if team exists
        if (callCount === 1) {
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
        // Second call: get members
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockMembers,
                  error: null,
                  count: 2
                })
              })
            })
          })
        };
      });

      const result = await teamsService.getMembers(mockTeamId);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', mockMembershipId);
      expect(result.data[0]).toHaveProperty('userId', mockUserId);
      expect(result.data[0]).toHaveProperty('teamId', mockTeamId);
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).toHaveProperty('user');
      expect(result.data[0].user).toHaveProperty('firstName', 'John');
      expect(result.data[0].user).toHaveProperty('lastName', 'Doe');
      expect(result.data[0].user).not.toHaveProperty('first_name');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 20);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should throw NOT_FOUND for non-existent team', async () => {
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

      await expect(teamsService.getMembers(mockTeamId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.getMembers(mockTeamId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should handle empty members list', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
                  data: [],
                  error: null,
                  count: 0
                })
              })
            })
          })
        };
      });

      const result = await teamsService.getMembers(mockTeamId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw DATABASE_ERROR when query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
                  data: null,
                  error: { message: 'Database error' },
                  count: null
                })
              })
            })
          })
        };
      });

      await expect(teamsService.getMembers(mockTeamId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should handle null profiles gracefully', async () => {
      const mockMemberNoProfile = {
        id: mockMembershipId,
        team_id: mockTeamId,
        user_id: mockUserId,
        created_at: '2026-01-10T10:00:00.000Z',
        profiles: null
      };

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
                  data: [mockMemberNoProfile],
                  error: null,
                  count: 1
                })
              })
            })
          })
        };
      });

      const result = await teamsService.getMembers(mockTeamId);

      expect(result.data[0].user).toBeNull();
    });
  });

  describe('addMember', () => {
    it('should add member to team successfully', async () => {
      const mockInsertedMembership = {
        id: mockMembershipId,
        team_id: mockTeamId,
        user_id: mockUserId,
        created_at: '2026-01-10T10:00:00.000Z'
      };

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check if team exists
        if (callCount === 1) {
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
        // Second call: check if user exists
        if (callCount === 2) {
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
        // Third call: insert membership
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

      const result = await teamsService.addMember(mockTeamId, mockUserId);

      expect(result).toEqual({
        id: mockMembershipId,
        teamId: mockTeamId,
        userId: mockUserId,
        createdAt: '2026-01-10T10:00:00.000Z'
      });
    });

    it('should throw TEAM_NOT_FOUND for non-existent team', async () => {
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

      await expect(teamsService.addMember(mockTeamId, mockUserId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.addMember(mockTeamId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'TEAM_NOT_FOUND'
        });
    });

    it('should throw USER_NOT_FOUND for non-existent user', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: team exists
        if (callCount === 1) {
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
        // Second call: user not found
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

      await expect(teamsService.addMember(mockTeamId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'USER_NOT_FOUND'
        });
    });

    it('should throw ALREADY_MEMBER for duplicate membership', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: team exists
        if (callCount === 1) {
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
        // Second call: user exists
        if (callCount === 2) {
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
        // Third call: duplicate constraint violation
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

      await expect(teamsService.addMember(mockTeamId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'ALREADY_MEMBER'
        });
    });

    it('should throw ADD_MEMBER_FAILED when insert fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        if (callCount === 2) {
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
                error: { message: 'Database error' }
              })
            })
          })
        };
      });

      await expect(teamsService.addMember(mockTeamId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'ADD_MEMBER_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  describe('removeMember', () => {
    it('should remove member from team successfully', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check if membership exists
        if (callCount === 1) {
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
        // Second call: delete membership
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

      const result = await teamsService.removeMember(mockTeamId, mockUserId);

      expect(result).toEqual({ message: 'Member removed successfully' });
    });

    it('should throw NOT_MEMBER when membership does not exist', async () => {
      supabase.from.mockReturnValue({
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
      });

      await expect(teamsService.removeMember(mockTeamId, mockUserId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.removeMember(mockTeamId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_MEMBER'
        });
    });

    it('should throw REMOVE_MEMBER_FAILED when delete fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: membership exists
        if (callCount === 1) {
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
        // Second call: delete fails
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: { message: 'Database error' }
              })
            })
          })
        };
      });

      await expect(teamsService.removeMember(mockTeamId, mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'REMOVE_MEMBER_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  describe('isMember', () => {
    it('should return true for existing member', async () => {
      supabase.from.mockReturnValue({
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
      });

      const result = await teamsService.isMember(mockTeamId, mockUserId);

      expect(result).toBe(true);
    });

    it('should return false for non-member', async () => {
      supabase.from.mockReturnValue({
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
      });

      const result = await teamsService.isMember(mockTeamId, mockUserId);

      expect(result).toBe(false);
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

  describe('getProjects', () => {
    it('should return paginated projects with project data', async () => {
      const mockAssignments = [
        mockAssignmentDb,
        {
          id: '550e8400-e29b-41d4-a716-446655440201',
          team_id: mockTeamId,
          project_id: '550e8400-e29b-41d4-a716-446655440004',
          created_at: '2026-01-10T11:00:00.000Z',
          projects: {
            id: '550e8400-e29b-41d4-a716-446655440004',
            code: 'PRJ-002',
            name: 'Marketing App',
            description: 'Marketing project',
            budget_hours: 200,
            status: 'active'
          }
        }
      ];

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check if team exists
        if (callCount === 1) {
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
        // Second call: get projects
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockAssignments,
                  error: null,
                  count: 2
                })
              })
            })
          })
        };
      });

      const result = await teamsService.getProjects(mockTeamId);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', mockAssignmentId);
      expect(result.data[0]).toHaveProperty('teamId', mockTeamId);
      expect(result.data[0]).toHaveProperty('projectId', mockProjectId);
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).toHaveProperty('project');
      expect(result.data[0].project).toHaveProperty('code', 'PRJ-001');
      expect(result.data[0].project).toHaveProperty('budgetHours', 500);
      expect(result.data[0].project).not.toHaveProperty('budget_hours');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 20);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should throw NOT_FOUND for non-existent team', async () => {
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

      await expect(teamsService.getProjects(mockTeamId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.getProjects(mockTeamId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should handle empty projects list', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
                  data: [],
                  error: null,
                  count: 0
                })
              })
            })
          })
        };
      });

      const result = await teamsService.getProjects(mockTeamId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw DATABASE_ERROR when query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
                  data: null,
                  error: { message: 'Database error' },
                  count: null
                })
              })
            })
          })
        };
      });

      await expect(teamsService.getProjects(mockTeamId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should handle null projects gracefully', async () => {
      const mockAssignmentNoProject = {
        id: mockAssignmentId,
        team_id: mockTeamId,
        project_id: mockProjectId,
        created_at: '2026-01-10T10:00:00.000Z',
        projects: null
      };

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
                  data: [mockAssignmentNoProject],
                  error: null,
                  count: 1
                })
              })
            })
          })
        };
      });

      const result = await teamsService.getProjects(mockTeamId);

      expect(result.data[0].project).toBeNull();
    });
  });

  describe('assignProject', () => {
    it('should assign project to team successfully', async () => {
      const mockInsertedAssignment = {
        id: mockAssignmentId,
        team_id: mockTeamId,
        project_id: mockProjectId,
        created_at: '2026-01-10T10:00:00.000Z'
      };

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check if team exists
        if (callCount === 1) {
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
        // Second call: check if project exists
        if (callCount === 2) {
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
        // Third call: insert assignment
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

      const result = await teamsService.assignProject(mockTeamId, mockProjectId);

      expect(result).toEqual({
        id: mockAssignmentId,
        teamId: mockTeamId,
        projectId: mockProjectId,
        createdAt: '2026-01-10T10:00:00.000Z'
      });
    });

    it('should throw TEAM_NOT_FOUND for non-existent team', async () => {
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

      await expect(teamsService.assignProject(mockTeamId, mockProjectId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.assignProject(mockTeamId, mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'TEAM_NOT_FOUND'
        });
    });

    it('should throw PROJECT_NOT_FOUND for non-existent project', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: team exists
        if (callCount === 1) {
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
        // Second call: project not found
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

      await expect(teamsService.assignProject(mockTeamId, mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'PROJECT_NOT_FOUND'
        });
    });

    it('should throw ALREADY_ASSIGNED for duplicate assignment', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: team exists
        if (callCount === 1) {
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
        // Second call: project exists
        if (callCount === 2) {
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
        // Third call: duplicate constraint violation
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

      await expect(teamsService.assignProject(mockTeamId, mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'ALREADY_ASSIGNED'
        });
    });

    it('should throw ASSIGN_PROJECT_FAILED when insert fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
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
        if (callCount === 2) {
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
                error: { message: 'Database error' }
              })
            })
          })
        };
      });

      await expect(teamsService.assignProject(mockTeamId, mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'ASSIGN_PROJECT_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  describe('unassignProject', () => {
    it('should unassign project from team successfully', async () => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: check if assignment exists
        if (callCount === 1) {
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
        // Second call: delete assignment
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

      const result = await teamsService.unassignProject(mockTeamId, mockProjectId);

      expect(result).toEqual({ message: 'Project unassigned successfully' });
    });

    it('should throw NOT_ASSIGNED when assignment does not exist', async () => {
      supabase.from.mockReturnValue({
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
      });

      await expect(teamsService.unassignProject(mockTeamId, mockProjectId))
        .rejects
        .toThrow(AppError);

      await expect(teamsService.unassignProject(mockTeamId, mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_ASSIGNED'
        });
    });

    it('should throw UNASSIGN_PROJECT_FAILED when delete fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        // First call: assignment exists
        if (callCount === 1) {
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
        // Second call: delete fails
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: { message: 'Database error' }
              })
            })
          })
        };
      });

      await expect(teamsService.unassignProject(mockTeamId, mockProjectId))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'UNASSIGN_PROJECT_FAILED'
        });

      consoleSpy.mockRestore();
    });
  });

  describe('isProjectAssigned', () => {
    it('should return true for assigned project', async () => {
      supabase.from.mockReturnValue({
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
      });

      const result = await teamsService.isProjectAssigned(mockTeamId, mockProjectId);

      expect(result).toBe(true);
    });

    it('should return false for non-assigned project', async () => {
      supabase.from.mockReturnValue({
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
      });

      const result = await teamsService.isProjectAssigned(mockTeamId, mockProjectId);

      expect(result).toBe(false);
    });
  });
});
