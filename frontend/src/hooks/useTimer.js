// frontend/src/hooks/useTimer.js
// Story 4.4: Simple Mode UI - Timer Hook

import { useState, useEffect, useRef, useCallback } from 'react';
import { timeEntriesService } from '../services/timeEntriesService';

/**
 * Hook for managing timer state with real-time updates
 * Story 4.4: Simple Mode UI
 *
 * @returns {Object} Timer state and actions
 */
export function useTimer() {
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Calculate elapsed time in seconds from a start time
   */
  const calculateElapsed = useCallback((startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now - start) / 1000);
  }, []);

  /**
   * Start the interval for real-time updates
   */
  const startInterval = useCallback((startTime) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set initial elapsed time
    setElapsedTime(calculateElapsed(startTime));

    // Update every second
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedTime(calculateElapsed(startTime));
      }
    }, 1000);
  }, [calculateElapsed]);

  /**
   * Stop the interval
   */
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Fetch active timer on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    const fetchActiveTimer = async () => {
      try {
        setIsLoading(true);
        const response = await timeEntriesService.getActive();

        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          setActiveTimer(response.data);
          startInterval(response.data.startTime);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchActiveTimer();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      stopInterval();
    };
  }, [startInterval, stopInterval]);

  /**
   * Start timer
   * @param {Object} options - Timer options
   * @returns {Promise<Object>} Created timer data
   */
  const startTimer = useCallback(async (options = {}) => {
    try {
      setIsStarting(true);
      setError(null);

      const response = await timeEntriesService.startTimer(options);

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        setActiveTimer(response.data);
        startInterval(response.data.startTime);
        return response.data;
      }

      throw new Error('Failed to start timer');
    } catch (err) {
      if (isMountedRef.current) {
        // If timer already running in another session/tab, sync with it
        // This is the expected behavior - user has one active timer at a time
        if (err.code === 'TIMER_ALREADY_RUNNING' && err.data) {
          // Sync state with the existing timer from server
          // Note: This timer is from the same user account, possibly from another tab
          setActiveTimer(err.data);
          startInterval(err.data.startTime);
          // Clear error since we successfully synced with existing timer
          setError(null);
        } else {
          setError(err.message);
        }
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsStarting(false);
      }
    }
  }, [startInterval]);

  /**
   * Stop timer
   * @param {Object} options - Optional updates to apply
   * @returns {Promise<Object>} Completed timer data
   */
  const stopTimer = useCallback(async (options = {}) => {
    try {
      setIsStopping(true);
      setError(null);

      const response = await timeEntriesService.stopTimer(options);

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        stopInterval();
        setActiveTimer(null);
        setElapsedTime(0);
        return response.data;
      }

      throw new Error('Failed to stop timer');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsStopping(false);
      }
    }
  }, [stopInterval]);

  /**
   * Format elapsed time as HH:MM:SS
   */
  const formatElapsedTime = useCallback(() => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedTime]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Sync with backend (refetch active timer)
   */
  const syncWithBackend = useCallback(async () => {
    try {
      const response = await timeEntriesService.getActive();

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        setActiveTimer(response.data);
        startInterval(response.data.startTime);
      } else {
        stopInterval();
        setActiveTimer(null);
        setElapsedTime(0);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [startInterval, stopInterval]);

  return {
    // State
    activeTimer,
    elapsedTime,
    formattedTime: formatElapsedTime(),
    isLoading,
    isStarting,
    isStopping,
    isRunning: !!activeTimer,
    error,

    // Actions
    startTimer,
    stopTimer,
    clearError,
    syncWithBackend
  };
}

export default useTimer;
