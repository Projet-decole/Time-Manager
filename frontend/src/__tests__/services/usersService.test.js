// frontend/src/__tests__/services/usersService.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService } from '../../services/usersService';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches users with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', email: 'test@example.com' }],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await usersService.getAll();

      expect(api.get).toHaveBeenCalledWith('/users?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('fetches users with custom page and limit', async () => {
      const mockResponse = {
        success: true,
        data: [],
        meta: { pagination: { page: 2, limit: 10, total: 15, totalPages: 2 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await usersService.getAll({ page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/users?page=2&limit=10');
      expect(result).toEqual(mockResponse);
    });

    it('fetches users with role filter', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', role: 'manager' }],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await usersService.getAll({ role: 'manager' });

      expect(api.get).toHaveBeenCalledWith('/users?page=1&limit=20&role=manager');
      expect(result).toEqual(mockResponse);
    });

    it('does not include role param when role is undefined', async () => {
      const mockResponse = {
        success: true,
        data: [],
        meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
      };
      api.get.mockResolvedValue(mockResponse);

      await usersService.getAll({ role: undefined });

      expect(api.get).toHaveBeenCalledWith('/users?page=1&limit=20');
    });
  });
});
