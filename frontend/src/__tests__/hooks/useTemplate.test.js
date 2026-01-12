// frontend/src/__tests__/hooks/useTemplate.test.js
// Story 4.10: Implement Template Mode UI - useTemplate Hook Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTemplate } from '../../hooks/useTemplate';
import templatesService from '../../services/templatesService';

// Mock the templatesService
vi.mock('../../services/templatesService', () => ({
  default: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    apply: vi.fn(),
    createFromDay: vi.fn()
  }
}));

describe('useTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('starts with correct initial state', () => {
      const { result } = renderHook(() => useTemplate());

      expect(result.current.template).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isApplying).toBe(false);
      expect(result.current.isBusy).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('getById', () => {
    it('fetches a template by ID', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Morning Routine',
        entries: []
      };
      templatesService.getById.mockResolvedValue({
        success: true,
        data: mockTemplate
      });

      const { result } = renderHook(() => useTemplate());

      await act(async () => {
        await result.current.getById('template-1');
      });

      expect(templatesService.getById).toHaveBeenCalledWith('template-1');
      expect(result.current.template).toEqual(mockTemplate);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles error when fetching', async () => {
      const error = new Error('Not found');
      templatesService.getById.mockRejectedValue(error);

      const { result } = renderHook(() => useTemplate());

      await act(async () => {
        try {
          await result.current.getById('invalid-id');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Not found');
    });
  });

  describe('create', () => {
    it('creates a new template', async () => {
      const templateData = {
        name: 'New Template',
        entries: [{ startTime: '09:00', endTime: '12:00' }]
      };
      const mockResponse = {
        success: true,
        data: { id: 'new-1', ...templateData }
      };
      templatesService.create.mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTemplate(onSuccess));

      await act(async () => {
        await result.current.create(templateData);
      });

      expect(templatesService.create).toHaveBeenCalledWith(templateData);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('sets isCreating during API call', async () => {
      let resolveCreate;
      const createPromise = new Promise(resolve => {
        resolveCreate = resolve;
      });
      templatesService.create.mockReturnValue(createPromise);

      const { result } = renderHook(() => useTemplate());

      let createResult;
      act(() => {
        createResult = result.current.create({ name: 'Test', entries: [] });
      });

      expect(result.current.isCreating).toBe(true);
      expect(result.current.isBusy).toBe(true);

      await act(async () => {
        resolveCreate({ success: true, data: { id: '1', name: 'Test' } });
        await createResult;
      });

      expect(result.current.isCreating).toBe(false);
    });

    it('handles error when creating', async () => {
      const error = new Error('Validation error');
      templatesService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useTemplate());

      await act(async () => {
        try {
          await result.current.create({ name: '', entries: [] });
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Validation error');
    });
  });

  describe('update', () => {
    it('updates a template', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = {
        success: true,
        data: { id: 'template-1', name: 'Updated Name' }
      };
      templatesService.update.mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTemplate(onSuccess));

      await act(async () => {
        await result.current.update('template-1', updateData);
      });

      expect(templatesService.update).toHaveBeenCalledWith('template-1', updateData);
      expect(result.current.template).toEqual(mockResponse.data);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('sets isUpdating during API call', async () => {
      let resolveUpdate;
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });
      templatesService.update.mockReturnValue(updatePromise);

      const { result } = renderHook(() => useTemplate());

      let updateResult;
      act(() => {
        updateResult = result.current.update('template-1', { name: 'Test' });
      });

      expect(result.current.isUpdating).toBe(true);

      await act(async () => {
        resolveUpdate({ success: true, data: { id: 'template-1', name: 'Test' } });
        await updateResult;
      });

      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('remove', () => {
    it('deletes a template', async () => {
      templatesService.delete.mockResolvedValue({ success: true });

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTemplate(onSuccess));

      // First set a template
      templatesService.getById.mockResolvedValue({
        success: true,
        data: { id: 'template-1', name: 'Test' }
      });
      await act(async () => {
        await result.current.getById('template-1');
      });

      expect(result.current.template).not.toBeNull();

      await act(async () => {
        await result.current.remove('template-1');
      });

      expect(templatesService.delete).toHaveBeenCalledWith('template-1');
      expect(result.current.template).toBeNull();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('sets isDeleting during API call', async () => {
      let resolveDelete;
      const deletePromise = new Promise(resolve => {
        resolveDelete = resolve;
      });
      templatesService.delete.mockReturnValue(deletePromise);

      const { result } = renderHook(() => useTemplate());

      let deleteResult;
      act(() => {
        deleteResult = result.current.remove('template-1');
      });

      expect(result.current.isDeleting).toBe(true);

      await act(async () => {
        resolveDelete({ success: true });
        await deleteResult;
      });

      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('apply', () => {
    it('applies a template to a date', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'day-1' },
        meta: { templateId: 'template-1', entriesApplied: 3 }
      };
      templatesService.apply.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTemplate());

      let response;
      await act(async () => {
        response = await result.current.apply('template-1', '2026-01-15');
      });

      expect(templatesService.apply).toHaveBeenCalledWith('template-1', { date: '2026-01-15' });
      expect(response).toEqual(mockResponse);
    });

    it('sets isApplying during API call', async () => {
      let resolveApply;
      const applyPromise = new Promise(resolve => {
        resolveApply = resolve;
      });
      templatesService.apply.mockReturnValue(applyPromise);

      const { result } = renderHook(() => useTemplate());

      let applyResult;
      act(() => {
        applyResult = result.current.apply('template-1', '2026-01-15');
      });

      expect(result.current.isApplying).toBe(true);

      await act(async () => {
        resolveApply({ success: true, data: {} });
        await applyResult;
      });

      expect(result.current.isApplying).toBe(false);
    });

    it('handles DATE_HAS_ENTRIES error', async () => {
      const error = new Error('Date has entries');
      error.code = 'DATE_HAS_ENTRIES';
      templatesService.apply.mockRejectedValue(error);

      const { result } = renderHook(() => useTemplate());

      await act(async () => {
        try {
          await result.current.apply('template-1', '2026-01-15');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Cette date contient deja des entrees');
    });

    it('handles TEMPLATE_EMPTY error', async () => {
      const error = new Error('Template empty');
      error.code = 'TEMPLATE_EMPTY';
      templatesService.apply.mockRejectedValue(error);

      const { result } = renderHook(() => useTemplate());

      await act(async () => {
        try {
          await result.current.apply('template-1', '2026-01-15');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Le template ne contient aucun bloc');
    });
  });

  describe('createFromDay', () => {
    it('creates a template from a day', async () => {
      const templateData = { name: 'Template from Day' };
      const mockResponse = {
        success: true,
        data: { id: 'new-template', ...templateData }
      };
      templatesService.createFromDay.mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useTemplate(onSuccess));

      await act(async () => {
        await result.current.createFromDay('day-1', templateData);
      });

      expect(templatesService.createFromDay).toHaveBeenCalledWith('day-1', templateData);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      const error = new Error('Test error');
      templatesService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useTemplate());

      await act(async () => {
        try {
          await result.current.create({ name: '', entries: [] });
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('resets template and error state', async () => {
      templatesService.getById.mockResolvedValue({
        success: true,
        data: { id: 'template-1', name: 'Test' }
      });

      const { result } = renderHook(() => useTemplate());

      await act(async () => {
        await result.current.getById('template-1');
      });

      expect(result.current.template).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.template).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
