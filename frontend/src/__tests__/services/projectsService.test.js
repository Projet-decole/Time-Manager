// frontend/src/__tests__/services/projectsService.test.js
// Story 3.7: Admin Management UI - Projects

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectsService } from '../../services/projectsService';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}));

describe('projectsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches projects with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', name: 'Project 1', code: 'PRJ-001' }],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await projectsService.getAll();

      expect(api.get).toHaveBeenCalledWith('/projects?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('fetches projects with includeArchived', async () => {
      const mockResponse = {
        success: true,
        data: [],
        meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
      };
      api.get.mockResolvedValue(mockResponse);

      await projectsService.getAll({ includeArchived: true });

      expect(api.get).toHaveBeenCalledWith('/projects?page=1&limit=20&includeArchived=true');
    });

    it('fetches projects with custom page and limit', async () => {
      const mockResponse = {
        success: true,
        data: [],
        meta: { pagination: { page: 2, limit: 10, total: 15, totalPages: 2 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await projectsService.getAll({ page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/projects?page=2&limit=10');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getById', () => {
    it('fetches a single project by ID', async () => {
      const mockResponse = {
        success: true,
        data: { id: '123', name: 'Test Project', code: 'PRJ-001' }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await projectsService.getById('123');

      expect(api.get).toHaveBeenCalledWith('/projects/123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('creates a project with required fields only', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'New Project', code: 'PRJ-001' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await projectsService.create({ name: 'New Project' });

      expect(api.post).toHaveBeenCalledWith('/projects', { name: 'New Project' });
      expect(result).toEqual(mockResponse);
    });

    it('creates a project with all fields', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Full Project', code: 'PRJ-002' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await projectsService.create({
        name: 'Full Project',
        description: 'A description',
        budgetHours: 100
      });

      expect(api.post).toHaveBeenCalledWith('/projects', {
        name: 'Full Project',
        description: 'A description',
        budgetHours: 100
      });
      expect(result).toEqual(mockResponse);
    });

    it('does not include budgetHours if empty', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      await projectsService.create({ name: 'Test', budgetHours: '' });

      expect(api.post).toHaveBeenCalledWith('/projects', { name: 'Test' });
    });
  });

  describe('update', () => {
    it('updates a project with provided fields', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Updated Name' }
      };
      api.patch.mockResolvedValue(mockResponse);

      const result = await projectsService.update('1', { name: 'Updated Name' });

      expect(api.patch).toHaveBeenCalledWith('/projects/1', { name: 'Updated Name' });
      expect(result).toEqual(mockResponse);
    });

    it('sets budgetHours to null when empty string', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.patch.mockResolvedValue(mockResponse);

      await projectsService.update('1', { budgetHours: '' });

      expect(api.patch).toHaveBeenCalledWith('/projects/1', { budgetHours: null });
    });
  });

  describe('archive', () => {
    it('archives a project', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', status: 'archived' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await projectsService.archive('1');

      expect(api.post).toHaveBeenCalledWith('/projects/1/archive');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('restore', () => {
    it('restores an archived project', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', status: 'active' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await projectsService.restore('1');

      expect(api.post).toHaveBeenCalledWith('/projects/1/restore');
      expect(result).toEqual(mockResponse);
    });
  });
});
