// frontend/src/__tests__/hooks/useTimeEntries.test.js
// Story 4.4: Simple Mode UI - useTimeEntries Hook Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTimeEntries } from '../../hooks/useTimeEntries';
import * as timeEntriesService from '../../services/timeEntriesService';

// Mock the timeEntriesService
vi.mock('../../services/timeEntriesService', () => ({
  timeEntriesService: {
    getAll: vi.fn()
  }
}));

const mockEntries = [
  {
    id: '1',
    startTime: '2026-01-12T10:00:00Z',
    endTime: '2026-01-12T12:00:00Z',
    durationMinutes: 120,
    project: { id: 'p1', name: 'Project A', code: 'PRJ-A' },
    category: { id: 'c1', name: 'Development', color: '#3B82F6' }
  },
  {
    id: '2',
    startTime: '2026-01-12T14:00:00Z',
    endTime: '2026-01-12T15:30:00Z',
    durationMinutes: 90,
    project: { id: 'p1', name: 'Project A', code: 'PRJ-A' },
    category: { id: 'c2', name: 'Meeting', color: '#10B981' }
  },
  {
    id: '3',
    startTime: '2026-01-11T09:00:00Z',
    endTime: '2026-01-11T11:00:00Z',
    durationMinutes: 120,
    project: null,
    category: null
  }
];

describe('useTimeEntries', () => {
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
      timeEntriesService.timeEntriesService.getAll.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useTimeEntries());

      expect(result.current.loading).toBe(true);
      expect(result.current.entries).toEqual([]);
      expect(result.current.error).toBeNull();

      // Clean up: resolve the promise and unmount
      resolvePromise({ success: true, data: [] });
      unmount();
    });
  });

  describe('Fetching Entries', () => {
    it('fetches entries on mount', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries,
        meta: { pagination: { page: 1, limit: 20, total: 3, totalPages: 1 } }
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(timeEntriesService.timeEntriesService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20
      });
      expect(result.current.entries).toEqual(mockEntries);
    });

    it('uses custom limit', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: [],
        meta: { pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }
      });

      renderHook(() => useTimeEntries({ limit: 10 }));

      await waitFor(() => {
        expect(timeEntriesService.timeEntriesService.getAll).toHaveBeenCalledWith({
          page: 1,
          limit: 10
        });
      });
    });

    it('handles API error', async () => {
      timeEntriesService.timeEntriesService.getAll.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.entries).toEqual([]);
    });

    it('handles API returning success: false', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: false
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Erreur lors du chargement des entrees');
    });
  });

  describe('groupedEntries', () => {
    it('groups entries by date', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const groups = result.current.groupedEntries;
      expect(groups.length).toBe(2); // Two different dates
    });

    it('sorts entries within groups by startTime descending', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const groups = result.current.groupedEntries;
      // First group (2026-01-12) should have entries sorted descending
      const jan12Group = groups.find(g => g.date === '2026-01-12');
      expect(jan12Group.entries[0].id).toBe('2'); // 14:00 comes after 10:00
      expect(jan12Group.entries[1].id).toBe('1'); // 10:00 is earlier
    });

    it('returns empty array when no entries', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: []
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.groupedEntries).toEqual([]);
    });
  });

  describe('refresh', () => {
    it('refetches entries', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(timeEntriesService.timeEntriesService.getAll).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('updates pagination state from API response', async () => {
      const paginationMeta = {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5
      };

      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries,
        meta: { pagination: paginationMeta }
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pagination).toEqual(paginationMeta);
    });

    it('nextPage fetches next page', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries,
        meta: { pagination: { page: 1, limit: 20, total: 100, totalPages: 5 } }
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        result.current.nextPage();
      });

      await waitFor(() => {
        expect(timeEntriesService.timeEntriesService.getAll).toHaveBeenCalledWith({
          page: 2,
          limit: 20
        });
      });
    });

    it('nextPage does nothing on last page', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries,
        meta: { pagination: { page: 5, limit: 20, total: 100, totalPages: 5 } }
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      act(() => {
        result.current.nextPage();
      });

      expect(timeEntriesService.timeEntriesService.getAll).not.toHaveBeenCalled();
    });

    it('prevPage fetches previous page', async () => {
      timeEntriesService.timeEntriesService.getAll
        .mockResolvedValueOnce({
          success: true,
          data: mockEntries,
          meta: { pagination: { page: 1, limit: 20, total: 100, totalPages: 5 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockEntries,
          meta: { pagination: { page: 2, limit: 20, total: 100, totalPages: 5 } }
        });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First go to page 2
      await act(async () => {
        result.current.nextPage();
      });

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2);
      });

      vi.clearAllMocks();

      await act(async () => {
        result.current.prevPage();
      });

      await waitFor(() => {
        expect(timeEntriesService.timeEntriesService.getAll).toHaveBeenCalledWith({
          page: 1,
          limit: 20
        });
      });
    });

    it('prevPage does nothing on first page', async () => {
      timeEntriesService.timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mockEntries,
        meta: { pagination: { page: 1, limit: 20, total: 100, totalPages: 5 } }
      });

      const { result } = renderHook(() => useTimeEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      act(() => {
        result.current.prevPage();
      });

      expect(timeEntriesService.timeEntriesService.getAll).not.toHaveBeenCalled();
    });
  });
});
