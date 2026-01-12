// frontend/src/__tests__/hooks/useCategories.test.js
// Story 3.8: Admin Management UI - Categories

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCategories } from '../../hooks/useCategories';
import * as categoriesService from '../../services/categoriesService';

// Mock the categoriesService
vi.mock('../../services/categoriesService', () => ({
  categoriesService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    activate: vi.fn()
  }
}));

const mockCategories = [
  {
    id: '1',
    name: 'Development',
    description: 'Coding tasks',
    color: '#3B82F6',
    isActive: true
  },
  {
    id: '2',
    name: 'Meeting',
    description: 'Meetings',
    color: '#10B981',
    isActive: true
  }
];

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('starts with loading true', () => {
      // Use a deferred promise that we control
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
      categoriesService.categoriesService.getAll.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useCategories());

      expect(result.current.loading).toBe(true);
      expect(result.current.categories).toEqual([]);
      expect(result.current.error).toBeNull();

      // Clean up: resolve the promise and unmount
      resolvePromise({ success: true, data: [] });
      unmount();
    });
  });

  describe('Fetching Categories', () => {
    it('fetches categories on mount', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(categoriesService.categoriesService.getAll).toHaveBeenCalledWith({
        includeInactive: false
      });
      expect(result.current.categories).toEqual(mockCategories);
    });

    it('passes includeInactive option to API', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });

      renderHook(() => useCategories({ includeInactive: true }));

      await waitFor(() => {
        expect(categoriesService.categoriesService.getAll).toHaveBeenCalledWith({
          includeInactive: true
        });
      });
    });

    it('handles API error', async () => {
      categoriesService.categoriesService.getAll.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.categories).toEqual([]);
    });

    it('handles API returning success: false', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: false,
        error: 'Failed to load'
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Hook uses the error message from the response, or falls back to default
      expect(result.current.error).toBe('Failed to load');
    });

    it('uses default error message when API returns success: false without error', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: false
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Erreur lors du chargement des categories');
    });
  });

  describe('refetch', () => {
    it('refetches categories with specified includeInactive', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.refetch(true);
      });

      expect(categoriesService.categoriesService.getAll).toHaveBeenCalledWith({
        includeInactive: true
      });
    });
  });

  describe('createCategory', () => {
    it('creates category and refreshes list', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.create.mockResolvedValue({
        success: true,
        data: { id: '3', name: 'New', color: '#FF0000' }
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.createCategory({ name: 'New', color: '#FF0000' });
      });

      expect(categoriesService.categoriesService.create).toHaveBeenCalledWith({
        name: 'New',
        color: '#FF0000'
      });
      expect(categoriesService.categoriesService.getAll).toHaveBeenCalled();
    });

    it('throws error when creation fails', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.create.mockRejectedValue(
        new Error('Duplicate name')
      );

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createCategory({ name: 'Existing', color: '#FF0000' });
        })
      ).rejects.toThrow('Duplicate name');
    });
  });

  describe('updateCategory', () => {
    it('updates category and refreshes list', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.update.mockResolvedValue({
        success: true,
        data: { ...mockCategories[0], name: 'Updated' }
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.updateCategory('1', { name: 'Updated' });
      });

      expect(categoriesService.categoriesService.update).toHaveBeenCalledWith('1', {
        name: 'Updated'
      });
      expect(categoriesService.categoriesService.getAll).toHaveBeenCalled();
    });

    it('throws error when update fails', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.update.mockRejectedValue(
        new Error('Update failed')
      );

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateCategory('1', { name: 'New Name' });
        })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deactivateCategory', () => {
    it('deactivates category and refreshes list', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.deactivate.mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.deactivateCategory('1');
      });

      expect(categoriesService.categoriesService.deactivate).toHaveBeenCalledWith('1');
      expect(categoriesService.categoriesService.getAll).toHaveBeenCalled();
    });

    it('throws error when deactivation fails', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.deactivate.mockRejectedValue(
        new Error('Cannot deactivate')
      );

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deactivateCategory('1');
        })
      ).rejects.toThrow('Cannot deactivate');
    });
  });

  describe('activateCategory', () => {
    it('activates category and refreshes list', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.activate.mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.activateCategory('1');
      });

      expect(categoriesService.categoriesService.activate).toHaveBeenCalledWith('1');
      expect(categoriesService.categoriesService.getAll).toHaveBeenCalled();
    });

    it('throws error when activation fails', async () => {
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories
      });
      categoriesService.categoriesService.activate.mockRejectedValue(
        new Error('Cannot activate')
      );

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.activateCategory('1');
        })
      ).rejects.toThrow('Cannot activate');
    });
  });
});
