// frontend/src/__tests__/hooks/useDayMode.test.js
// Story 4.7: Day Mode UI with Timeline - useDayMode Hook Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDayMode } from '../../hooks/useDayMode';
import * as timeEntriesService from '../../services/timeEntriesService';

// Mock the timeEntriesService
vi.mock('../../services/timeEntriesService', () => ({
  timeEntriesService: {
    getActiveDay: vi.fn(),
    startDay: vi.fn(),
    endDay: vi.fn(),
    getByMode: vi.fn()
  }
}));

describe('useDayMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getByMode to avoid unhandled rejections
    timeEntriesService.timeEntriesService.getByMode.mockResolvedValue({
      success: true,
      data: []
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('starts with loading true and no active day', async () => {
      // Use a deferred promise that we control
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
      timeEntriesService.timeEntriesService.getActiveDay.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useDayMode());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.activeDay).toBeNull();
      expect(result.current.hasActiveDay).toBe(false);

      // Clean up: resolve the promise and unmount
      resolvePromise({ success: true, data: null });
      unmount();
    });
  });

  describe('Fetching Active Day', () => {
    it('fetches active day on mount', async () => {
      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: null
      });

      renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(timeEntriesService.timeEntriesService.getActiveDay).toHaveBeenCalled();
    });

    it('handles no active day on mount', async () => {
      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: null
      });

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeDay).toBeNull();
      expect(result.current.hasActiveDay).toBe(false);
      expect(result.current.blocks).toEqual([]);
    });

    it('sets activeDay and blocks when day exists', async () => {
      const mockDay = {
        id: 'day-1',
        startTime: '2026-01-12T08:00:00Z',
        endTime: null,
        blocks: [
          { id: 'block-1', startTime: '2026-01-12T09:00:00Z', endTime: '2026-01-12T10:00:00Z' }
        ]
      };

      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: mockDay
      });

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeDay).toEqual(mockDay);
      expect(result.current.hasActiveDay).toBe(true);
      expect(result.current.blocks).toHaveLength(1);
    });

    it('handles 404 error gracefully (no active day)', async () => {
      const error = new Error('Not found');
      error.status = 404;
      timeEntriesService.timeEntriesService.getActiveDay.mockRejectedValue(error);

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeDay).toBeNull();
      expect(result.current.error).toBeNull(); // 404 should not set error
    });

    it('handles API error on mount', async () => {
      const error = new Error('Network error');
      error.status = 500;
      timeEntriesService.timeEntriesService.getActiveDay.mockRejectedValue(error);

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('startDay', () => {
    it('calls API and updates state on success', async () => {
      const mockDay = {
        id: 'day-1',
        startTime: new Date().toISOString(),
        endTime: null,
        blocks: []
      };

      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: null
      });
      timeEntriesService.timeEntriesService.startDay.mockResolvedValue({
        success: true,
        data: mockDay
      });

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.hasActiveDay).toBe(false);

      await act(async () => {
        await result.current.startDay('Test description');
      });

      expect(timeEntriesService.timeEntriesService.startDay).toHaveBeenCalledWith({
        description: 'Test description'
      });
      expect(result.current.activeDay).toEqual(mockDay);
      expect(result.current.hasActiveDay).toBe(true);
      expect(result.current.blocks).toEqual([]);
    });

    it('sets isStartingDay during API call', async () => {
      let resolveStart;
      const startPromise = new Promise(resolve => {
        resolveStart = resolve;
      });

      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: null
      });
      timeEntriesService.timeEntriesService.startDay.mockReturnValue(startPromise);

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let startPromiseResult;
      act(() => {
        startPromiseResult = result.current.startDay();
      });

      expect(result.current.isStartingDay).toBe(true);

      await act(async () => {
        resolveStart({ success: true, data: { id: 'day-1', startTime: new Date().toISOString() } });
        await startPromiseResult;
      });

      expect(result.current.isStartingDay).toBe(false);
    });

    it('handles API error when starting', async () => {
      const startError = new Error('Start failed');
      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: null
      });
      timeEntriesService.timeEntriesService.startDay.mockRejectedValue(startError);

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let caughtError;
      await act(async () => {
        try {
          await result.current.startDay();
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBe(startError);
      expect(result.current.error).toBe('Start failed');
    });
  });

  describe('endDay', () => {
    it('calls API and resets state on success', async () => {
      const mockDay = {
        id: 'day-1',
        startTime: '2026-01-12T08:00:00Z',
        endTime: null,
        blocks: []
      };

      const mockSummary = {
        ...mockDay,
        endTime: '2026-01-12T17:00:00Z',
        durationMinutes: 540,
        meta: {
          totalBlocksMinutes: 480,
          unallocatedMinutes: 60
        }
      };

      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: mockDay
      });
      timeEntriesService.timeEntriesService.endDay.mockResolvedValue({
        success: true,
        data: mockSummary
      });

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.hasActiveDay).toBe(true);

      let summary;
      await act(async () => {
        summary = await result.current.endDay();
      });

      expect(timeEntriesService.timeEntriesService.endDay).toHaveBeenCalled();
      expect(summary).toEqual(mockSummary);
      expect(result.current.activeDay).toBeNull();
      expect(result.current.hasActiveDay).toBe(false);
      expect(result.current.blocks).toEqual([]);
    });

    it('sets isEndingDay during API call', async () => {
      const mockDay = {
        id: 'day-1',
        startTime: '2026-01-12T08:00:00Z',
        blocks: []
      };

      let resolveEnd;
      const endPromise = new Promise(resolve => {
        resolveEnd = resolve;
      });

      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: mockDay
      });
      timeEntriesService.timeEntriesService.endDay.mockReturnValue(endPromise);

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let endPromiseResult;
      act(() => {
        endPromiseResult = result.current.endDay();
      });

      expect(result.current.isEndingDay).toBe(true);

      await act(async () => {
        resolveEnd({ success: true, data: { ...mockDay, endTime: new Date().toISOString() } });
        await endPromiseResult;
      });

      expect(result.current.isEndingDay).toBe(false);
    });
  });

  describe('getDayStats', () => {
    it('returns null when no active day', async () => {
      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: null
      });

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.getDayStats()).toBeNull();
    });

    it('calculates stats correctly', async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const mockDay = {
        id: 'day-1',
        startTime: twoHoursAgo.toISOString(),
        endTime: null,
        blocks: [
          { id: 'block-1', durationMinutes: 60 },
          { id: 'block-2', durationMinutes: 30 }
        ]
      };

      timeEntriesService.timeEntriesService.getActiveDay.mockResolvedValue({
        success: true,
        data: mockDay
      });

      const { result } = renderHook(() => useDayMode());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const stats = result.current.getDayStats();

      expect(stats).not.toBeNull();
      expect(stats.allocatedMinutes).toBe(90); // 60 + 30
      expect(stats.totalMinutes).toBeGreaterThanOrEqual(119); // ~120 minutes
      expect(stats.unallocatedMinutes).toBeGreaterThan(0);
      expect(stats.allocationPercentage).toBeGreaterThan(0);
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      const error = new Error('Test error');
      error.status = 500;
      timeEntriesService.timeEntriesService.getActiveDay.mockRejectedValue(error);

      const { result } = renderHook(() => useDayMode());

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
