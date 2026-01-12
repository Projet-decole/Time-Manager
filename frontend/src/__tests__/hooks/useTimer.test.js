// frontend/src/__tests__/hooks/useTimer.test.js
// Story 4.4: Simple Mode UI - useTimer Hook Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../../hooks/useTimer';
import * as timeEntriesService from '../../services/timeEntriesService';

// Mock the timeEntriesService
vi.mock('../../services/timeEntriesService', () => ({
  timeEntriesService: {
    getActive: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn()
  }
}));

describe('useTimer', () => {
  beforeEach(() => {
    // Use shouldAdvanceTime to allow setTimeout to resolve while still controlling setInterval
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('starts with loading true and no active timer', async () => {
      // Use a deferred promise that we control
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
      timeEntriesService.timeEntriesService.getActive.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useTimer());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.activeTimer).toBeNull();
      expect(result.current.isRunning).toBe(false);

      // Clean up: resolve the promise and unmount
      resolvePromise({ success: true, data: null });
      unmount();
    });
  });

  describe('Fetching Active Timer', () => {
    it('fetches active timer on mount', async () => {
      timeEntriesService.timeEntriesService.getActive.mockResolvedValue({
        success: true,
        data: null
      });

      renderHook(() => useTimer());

      // Wait for the promise to resolve
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(timeEntriesService.timeEntriesService.getActive).toHaveBeenCalled();
    });

    it('handles no active timer on mount', async () => {
      timeEntriesService.timeEntriesService.getActive.mockResolvedValue({
        success: true,
        data: null
      });

      const { result } = renderHook(() => useTimer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeTimer).toBeNull();
      expect(result.current.isRunning).toBe(false);
    });

    it('handles API error on mount', async () => {
      timeEntriesService.timeEntriesService.getActive.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useTimer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('startTimer', () => {
    it('calls API and updates state on success', async () => {
      const mockTimer = {
        id: '1',
        startTime: new Date().toISOString()
      };

      timeEntriesService.timeEntriesService.getActive.mockResolvedValue({
        success: true,
        data: null
      });
      timeEntriesService.timeEntriesService.startTimer.mockResolvedValue({
        success: true,
        data: mockTimer
      });

      const { result } = renderHook(() => useTimer());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Start timer
      await act(async () => {
        await result.current.startTimer({ projectId: 'proj-1' });
      });

      expect(timeEntriesService.timeEntriesService.startTimer).toHaveBeenCalledWith({
        projectId: 'proj-1'
      });
      expect(result.current.activeTimer).toEqual(mockTimer);
      expect(result.current.isRunning).toBe(true);
    });

    it('handles API error when starting', async () => {
      const startError = new Error('Start failed');
      timeEntriesService.timeEntriesService.getActive.mockResolvedValue({
        success: true,
        data: null
      });
      timeEntriesService.timeEntriesService.startTimer.mockRejectedValue(startError);

      const { result } = renderHook(() => useTimer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let caughtError;
      await act(async () => {
        try {
          await result.current.startTimer();
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBe(startError);
    });
  });

  describe('stopTimer', () => {
    it('calls API and resets state on success', async () => {
      const mockTimer = {
        id: '1',
        startTime: new Date().toISOString()
      };

      timeEntriesService.timeEntriesService.getActive.mockResolvedValue({
        success: true,
        data: null // Start with no timer
      });
      timeEntriesService.timeEntriesService.startTimer.mockResolvedValue({
        success: true,
        data: mockTimer
      });
      timeEntriesService.timeEntriesService.stopTimer.mockResolvedValue({
        success: true,
        data: { ...mockTimer, endTime: new Date().toISOString(), durationMinutes: 60 }
      });

      const { result } = renderHook(() => useTimer());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Start timer first
      await act(async () => {
        await result.current.startTimer();
      });

      expect(result.current.isRunning).toBe(true);

      // Stop timer
      await act(async () => {
        await result.current.stopTimer({ description: 'Test' });
      });

      expect(timeEntriesService.timeEntriesService.stopTimer).toHaveBeenCalledWith({
        description: 'Test'
      });
      expect(result.current.activeTimer).toBeNull();
      expect(result.current.isRunning).toBe(false);
      expect(result.current.elapsedTime).toBe(0);
    });

    it('handles API error when stopping', async () => {
      const stopError = new Error('Stop failed');
      timeEntriesService.timeEntriesService.getActive.mockResolvedValue({
        success: true,
        data: null
      });
      timeEntriesService.timeEntriesService.startTimer.mockResolvedValue({
        success: true,
        data: { id: '1', startTime: new Date().toISOString() }
      });
      timeEntriesService.timeEntriesService.stopTimer.mockRejectedValue(stopError);

      const { result } = renderHook(() => useTimer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Start timer first
      await act(async () => {
        await result.current.startTimer();
      });

      let caughtError;
      await act(async () => {
        try {
          await result.current.stopTimer();
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBe(stopError);
    });
  });

  describe('formattedTime', () => {
    it('returns HH:MM:SS format', async () => {
      timeEntriesService.timeEntriesService.getActive.mockResolvedValue({
        success: true,
        data: null
      });

      const { result } = renderHook(() => useTimer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // With 0 elapsed time, should return 00:00:00
      expect(result.current.formattedTime).toBe('00:00:00');
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      timeEntriesService.timeEntriesService.getActive.mockRejectedValue(
        new Error('Test error')
      );

      const { result } = renderHook(() => useTimer());

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
