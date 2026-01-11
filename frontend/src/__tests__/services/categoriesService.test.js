// frontend/src/__tests__/services/categoriesService.test.js
// Story 3.8: Admin Management UI - Categories

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoriesService } from '../../services/categoriesService';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

describe('categoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches categories without query params by default', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      const result = await categoriesService.getAll();

      expect(api.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockResponse);
    });

    it('fetches categories with includeInactive param', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      await categoriesService.getAll({ includeInactive: true });

      expect(api.get).toHaveBeenCalledWith('/categories?includeInactive=true');
    });

    it('does not add param when includeInactive is false', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      await categoriesService.getAll({ includeInactive: false });

      expect(api.get).toHaveBeenCalledWith('/categories');
    });
  });

  describe('getById', () => {
    it('fetches a single category by ID', async () => {
      const mockResponse = { success: true, data: { id: '1', name: 'Test' } };
      api.get.mockResolvedValue(mockResponse);

      const result = await categoriesService.getById('1');

      expect(api.get).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('creates a category with all fields', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      const categoryData = {
        name: 'Development',
        description: 'Coding tasks',
        color: '#3B82F6'
      };

      const result = await categoriesService.create(categoryData);

      expect(api.post).toHaveBeenCalledWith('/categories', {
        name: 'Development',
        description: 'Coding tasks',
        color: '#3B82F6'
      });
      expect(result).toEqual(mockResponse);
    });

    it('creates a category with null description when empty', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      await categoriesService.create({
        name: 'Test',
        description: '',
        color: '#FF0000'
      });

      expect(api.post).toHaveBeenCalledWith('/categories', {
        name: 'Test',
        description: null,
        color: '#FF0000'
      });
    });

    it('creates a category with null description when undefined', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      await categoriesService.create({
        name: 'Test',
        color: '#FF0000'
      });

      expect(api.post).toHaveBeenCalledWith('/categories', {
        name: 'Test',
        description: null,
        color: '#FF0000'
      });
    });
  });

  describe('update', () => {
    it('updates a category with provided fields only', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.patch.mockResolvedValue(mockResponse);

      await categoriesService.update('1', { name: 'Updated Name' });

      expect(api.patch).toHaveBeenCalledWith('/categories/1', {
        name: 'Updated Name'
      });
    });

    it('updates multiple fields', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.patch.mockResolvedValue(mockResponse);

      await categoriesService.update('1', {
        name: 'Updated',
        description: 'New description',
        color: '#FF0000'
      });

      expect(api.patch).toHaveBeenCalledWith('/categories/1', {
        name: 'Updated',
        description: 'New description',
        color: '#FF0000'
      });
    });

    it('does not include undefined fields', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.patch.mockResolvedValue(mockResponse);

      await categoriesService.update('1', {
        name: 'Updated',
        description: undefined,
        color: undefined
      });

      expect(api.patch).toHaveBeenCalledWith('/categories/1', {
        name: 'Updated'
      });
    });
  });

  describe('deactivate', () => {
    it('deactivates a category by ID', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await categoriesService.deactivate('1');

      expect(api.delete).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('activate', () => {
    it('activates a category by ID', async () => {
      const mockResponse = { success: true };
      api.post.mockResolvedValue(mockResponse);

      const result = await categoriesService.activate('1');

      expect(api.post).toHaveBeenCalledWith('/categories/1/activate', {});
      expect(result).toEqual(mockResponse);
    });
  });
});
