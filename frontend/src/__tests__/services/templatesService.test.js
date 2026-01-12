// frontend/src/__tests__/services/templatesService.test.js
// Story 4.10: Implement Template Mode UI - templatesService Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import templatesService from '../../services/templatesService';
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

describe('templatesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches templates with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: '1', name: 'Template 1' },
          { id: '2', name: 'Template 2' }
        ],
        meta: { pagination: { page: 1, limit: 20, total: 2 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await templatesService.getAll();

      expect(api.get).toHaveBeenCalledWith('/templates?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('fetches templates with custom pagination', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      await templatesService.getAll({ page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/templates?page=2&limit=10');
    });
  });

  describe('getById', () => {
    it('fetches a single template by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'template-1',
          name: 'Morning Routine',
          entries: []
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await templatesService.getById('template-1');

      expect(api.get).toHaveBeenCalledWith('/templates/template-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('creates a new template', async () => {
      const templateData = {
        name: 'New Template',
        description: 'Test description',
        entries: [
          { startTime: '09:00', endTime: '12:00' }
        ]
      };
      const mockResponse = {
        success: true,
        data: { id: 'new-1', ...templateData }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await templatesService.create(templateData);

      expect(api.post).toHaveBeenCalledWith('/templates', templateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('updates an existing template', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = {
        success: true,
        data: { id: 'template-1', name: 'Updated Name' }
      };
      api.patch.mockResolvedValue(mockResponse);

      const result = await templatesService.update('template-1', updateData);

      expect(api.patch).toHaveBeenCalledWith('/templates/template-1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('deletes a template', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await templatesService.delete('template-1');

      expect(api.delete).toHaveBeenCalledWith('/templates/template-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apply', () => {
    it('applies a template to a date', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'day-1',
          startTime: '2026-01-15T09:00:00Z',
          endTime: '2026-01-15T17:00:00Z'
        },
        meta: {
          templateId: 'template-1',
          entriesApplied: 3
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await templatesService.apply('template-1', { date: '2026-01-15' });

      expect(api.post).toHaveBeenCalledWith('/templates/template-1/apply', { date: '2026-01-15' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createFromDay', () => {
    it('creates a template from an existing day', async () => {
      const templateData = {
        name: 'Template from Day',
        description: 'Created from day entry'
      };
      const mockResponse = {
        success: true,
        data: {
          id: 'template-new',
          ...templateData,
          entries: []
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await templatesService.createFromDay('day-1', templateData);

      expect(api.post).toHaveBeenCalledWith('/templates/from-day/day-1', templateData);
      expect(result).toEqual(mockResponse);
    });
  });
});
