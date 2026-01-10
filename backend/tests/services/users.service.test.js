// backend/tests/services/users.service.test.js

const usersService = require('../../services/users.service');
const AppError = require('../../utils/AppError');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Users Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const mockProfileDb = {
    id: mockUserId,
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'employee',
    weekly_hours_target: 35,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  describe('getProfile', () => {
    it('should return profile in camelCase format', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      const result = await usersService.getProfile(mockUserId);

      expect(result).toEqual({
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        weeklyHoursTarget: 35,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      });
    });

    it('should throw NOT_FOUND when profile does not exist', async () => {
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

      await expect(usersService.getProfile(mockUserId))
        .rejects
        .toThrow(AppError);

      await expect(usersService.getProfile(mockUserId))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND'
        });
    });

    it('should query the profiles table with correct user ID', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfileDb,
            error: null
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect
      });

      await usersService.getProfile(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith(
        'id, email, first_name, last_name, role, weekly_hours_target, created_at, updated_at'
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile with allowed fields only', async () => {
      const updatedProfileDb = {
        ...mockProfileDb,
        first_name: 'Jane',
        last_name: 'Smith',
        weekly_hours_target: 40
      };

      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedProfileDb,
                error: null
              })
            })
          })
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      const result = await usersService.updateProfile(mockUserId, {
        firstName: 'Jane',
        lastName: 'Smith',
        weeklyHoursTarget: 40
      });

      expect(result).toEqual({
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'employee',
        weeklyHoursTarget: 40,
        createdAt: mockProfileDb.created_at,
        updatedAt: mockProfileDb.updated_at
      });
    });

    it('should filter out email field from update', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate,
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      await usersService.updateProfile(mockUserId, {
        email: 'hacker@evil.com',
        firstName: 'John'
      });

      // Check that update was called without email
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('email');
      expect(updateCall).toHaveProperty('first_name', 'John');
    });

    it('should filter out role field from update', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate,
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      await usersService.updateProfile(mockUserId, {
        role: 'admin',
        firstName: 'John'
      });

      // Check that update was called without role
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('role');
      expect(updateCall).toHaveProperty('first_name', 'John');
    });

    it('should return current profile when no valid fields provided', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      const result = await usersService.updateProfile(mockUserId, {
        email: 'hacker@evil.com',
        role: 'admin'
      });

      // Should return current profile without calling update
      expect(result).toEqual({
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        weeklyHoursTarget: 35,
        createdAt: mockProfileDb.created_at,
        updatedAt: mockProfileDb.updated_at
      });
    });

    it('should throw UPDATE_FAILED when database update fails', async () => {
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

      await expect(usersService.updateProfile(mockUserId, { firstName: 'Jane' }))
        .rejects
        .toThrow(AppError);

      await expect(usersService.updateProfile(mockUserId, { firstName: 'Jane' }))
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'UPDATE_FAILED'
        });
    });

    it('should include updated_at timestamp in update', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      await usersService.updateProfile(mockUserId, { firstName: 'Jane' });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(typeof updateCall.updated_at).toBe('string');
    });

    it('should convert camelCase to snake_case for database', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileDb,
              error: null
            })
          })
        })
      });

      supabase.from.mockReturnValue({
        update: mockUpdate
      });

      await usersService.updateProfile(mockUserId, {
        firstName: 'Jane',
        lastName: 'Smith',
        weeklyHoursTarget: 40
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('first_name', 'Jane');
      expect(updateCall).toHaveProperty('last_name', 'Smith');
      expect(updateCall).toHaveProperty('weekly_hours_target', 40);
    });
  });

  describe('getAllUsers', () => {
    const mockUsersList = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'employee@test.com',
        first_name: 'Employee',
        last_name: 'User',
        role: 'employee',
        weekly_hours_target: 35,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'manager@test.com',
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager',
        weekly_hours_target: 40,
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z'
      }
    ];

    it('should return paginated list of users in camelCase', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockUsersList,
              error: null,
              count: 2
            })
          })
        })
      });

      const result = await usersService.getAllUsers();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('firstName');
      expect(result.data[0]).toHaveProperty('lastName');
      expect(result.data[0]).not.toHaveProperty('first_name');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 20);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    it('should filter by role when role filter is provided', async () => {
      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [mockUsersList[0]],
            error: null,
            count: 1
          })
        })
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockUsersList,
              error: null,
              count: 2
            })
          })
        })
      });

      await usersService.getAllUsers({ role: 'employee' });

      expect(mockEq).toHaveBeenCalledWith('role', 'employee');
    });

    it('should ignore invalid role filter values', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockUsersList,
            error: null,
            count: 2
          })
        })
      });

      supabase.from.mockReturnValue({
        select: mockSelect
      });

      await usersService.getAllUsers({ role: 'invalid_role' });

      // Should not call eq for invalid role
      expect(mockSelect().eq).toBeUndefined;
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

      await expect(usersService.getAllUsers())
        .rejects
        .toThrow(AppError);

      await expect(usersService.getAllUsers())
        .rejects
        .toMatchObject({
          statusCode: 500,
          code: 'DATABASE_ERROR'
        });

      consoleSpy.mockRestore();
    });

    it('should use custom pagination when provided', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: mockUsersList,
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

      const result = await usersService.getAllUsers({}, { page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      // Offset should be (2-1)*10 = 10, so range(10, 19)
      expect(mockRange).toHaveBeenCalledWith(10, 19);
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

      const result = await usersService.getAllUsers();

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

      const result = await usersService.getAllUsers();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});
