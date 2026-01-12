// frontend/src/hooks/useDayMode.js
// Story 4.7: Day Mode UI with Timeline - Day Mode State Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { timeEntriesService } from '../services/timeEntriesService';

/**
 * Hook for managing day mode state
 * Story 4.7: Day Mode UI with Timeline
 *
 * @returns {Object} Day mode state and actions
 */
export function useDayMode() {
  const [activeDay, setActiveDay] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [completedDays, setCompletedDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingDay, setIsStartingDay] = useState(false);
  const [isEndingDay, setIsEndingDay] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  /**
   * Fetch active day on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    const fetchActiveDay = async () => {
      try {
        setIsLoading(true);
        const response = await timeEntriesService.getActiveDay();

        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          setActiveDay(response.data);
          setBlocks(response.data.blocks || []);
        } else {
          setActiveDay(null);
          setBlocks([]);
        }
      } catch (err) {
        if (isMountedRef.current) {
          // 404 means no active day, which is not an error
          if (err.status !== 404) {
            setError(err.message);
          }
          setActiveDay(null);
          setBlocks([]);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchActiveDay();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch completed days (for history)
   */
  const fetchCompletedDays = useCallback(async () => {
    try {
      const response = await timeEntriesService.getByMode({
        entryMode: 'day',
        limit: 10
      });

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        // Filter only parent day entries (not blocks) that are completed
        const completed = response.data.filter(
          (entry) =>
            entry.endTime !== null &&
            entry.parentId === null && // Only parent entries (days), not child blocks
            entry.id !== activeDay?.id
        );
        setCompletedDays(completed);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Failed to fetch completed days:', err);
      }
    }
  }, [activeDay?.id]);

  /**
   * Fetch completed days when no active day
   */
  useEffect(() => {
    if (!isLoading && !activeDay) {
      fetchCompletedDays();
    }
  }, [isLoading, activeDay, fetchCompletedDays]);

  /**
   * Start day
   * @param {string} [description] - Optional day description
   * @returns {Promise<Object>} Created day data
   */
  const startDay = useCallback(async (description = null) => {
    try {
      setIsStartingDay(true);
      setError(null);

      const data = {};
      if (description) data.description = description;

      const response = await timeEntriesService.startDay(data);

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        setActiveDay(response.data);
        setBlocks([]);
        return response.data;
      }

      throw new Error('Echec du demarrage de la journee');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsStartingDay(false);
      }
    }
  }, []);

  /**
   * End day
   * @returns {Promise<Object>} Day summary data
   */
  const endDay = useCallback(async () => {
    try {
      setIsEndingDay(true);
      setError(null);

      const response = await timeEntriesService.endDay();

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        const summary = response.data;
        setActiveDay(null);
        setBlocks([]);
        // Refresh completed days list
        fetchCompletedDays();
        return summary;
      }

      throw new Error('Echec de la fin de journee');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsEndingDay(false);
      }
    }
  }, [fetchCompletedDays]);

  /**
   * Refresh blocks from API
   * Optimized to fetch only blocks instead of full day data
   */
  const refreshBlocks = useCallback(async () => {
    if (!activeDay) return;

    try {
      const response = await timeEntriesService.getDayBlocks();

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        setBlocks(response.data || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [activeDay]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Calculate day statistics
   */
  const getDayStats = useCallback(() => {
    if (!activeDay) return null;

    const startTime = new Date(activeDay.startTime);
    const endTime = activeDay.endTime ? new Date(activeDay.endTime) : new Date();
    const totalMinutes = Math.floor((endTime - startTime) / (1000 * 60));

    const allocatedMinutes = blocks.reduce((sum, block) => {
      return sum + (block.durationMinutes || 0);
    }, 0);

    const unallocatedMinutes = totalMinutes - allocatedMinutes;
    const allocationPercentage = totalMinutes > 0
      ? Math.round((allocatedMinutes / totalMinutes) * 100)
      : 0;

    return {
      totalMinutes,
      allocatedMinutes,
      unallocatedMinutes,
      allocationPercentage
    };
  }, [activeDay, blocks]);

  return {
    // State
    activeDay,
    blocks,
    completedDays,
    isLoading,
    isStartingDay,
    isEndingDay,
    hasActiveDay: !!activeDay,
    error,

    // Actions
    startDay,
    endDay,
    refreshBlocks,
    setBlocks,
    clearError,

    // Computed
    getDayStats
  };
}

export default useDayMode;
