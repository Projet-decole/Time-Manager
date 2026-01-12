// frontend/src/__tests__/hooks/useTemplates.test.js
// Story 4.10: Implement Template Mode UI - useTemplates Hook Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTemplates } from '../../hooks/useTemplates';
import templatesService from '../../services/templatesService';

// Mock the templatesService
vi.mock('../../services/templatesService', () => ({
  default: {
    getAll: vi.fn()
  }
}));

describe('useTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('starts with loading true and empty templates', async () => {
      // Use a deferred promise that we control
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
      templatesService.getAll.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useTemplates());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.templates).toEqual([]);
      expect(result.current.hasTemplates).toBe(false);

      // Clean up: resolve the promise and unmount
      resolvePromise({ success: true, data: [] });
      unmount();
    });
  });

  describe('Fetching Templates', () => {
    it('fetches templates on mount', async () => {
      templatesService.getAll.mockResolvedValue({
        success: true,
        data: []
      });

      renderHook(() => useTemplates());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(templatesService.getAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('sets templates when data exists', async () => {
      const mockTemplates = [
        { id: '1', name: 'Template 1', entries: [] },
        { id: '2', name: 'Template 2', entries: [] }
      ];

      templatesService.getAll.mockResolvedValue({
        success: true,
        data: mockTemplates,
        meta: { pagination: { page: 1, limit: 20, total: 2 } }
      });

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.templates).toEqual(mockTemplates);
      expect(result.current.hasTemplates).toBe(true);
      expect(result.current.pagination).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('handles empty response', async () => {
      templatesService.getAll.mockResolvedValue({
        success: true,
        data: []
      });

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.templates).toEqual([]);
      expect(result.current.hasTemplates).toBe(false);
    });

    it('handles API error', async () => {
      const error = new Error('Network error');
      templatesService.getAll.mockRejectedValue(error);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.templates).toEqual([]);
    });

    it('uses custom pagination options', async () => {
      templatesService.getAll.mockResolvedValue({
        success: true,
        data: []
      });

      renderHook(() => useTemplates({ page: 2, limit: 10 }));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(templatesService.getAll).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  describe('refresh', () => {
    it('refetches templates', async () => {
      templatesService.getAll.mockResolvedValue({
        success: true,
        data: [{ id: '1', name: 'Template 1' }]
      });

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(templatesService.getAll).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.refresh();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(templatesService.getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      const error = new Error('Test error');
      templatesService.getAll.mockRejectedValue(error);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
