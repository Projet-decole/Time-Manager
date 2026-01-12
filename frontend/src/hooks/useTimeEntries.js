// frontend/src/hooks/useTimeEntries.js
// Story 4.4: Simple Mode UI - Time Entries Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { timeEntriesService } from '../services/timeEntriesService';

/**
 * Hook for managing time entries data and operations
 * Story 4.4: Simple Mode UI
 *
 * @param {Object} options - Hook options
 * @param {number} [options.limit=20] - Items per page
 * @returns {Object} Time entries state and operations
 */
export function useTimeEntries({ limit = 20 } = {}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 0
  });

  const isMountedRef = useRef(true);

  /**
   * Fetch time entries from API
   */
  const fetchEntries = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await timeEntriesService.getAll({
        page,
        limit: pagination.limit
      });

      if (!isMountedRef.current) return;

      if (response.success) {
        setEntries(response.data);
        setPagination(response.meta?.pagination || {
          page,
          limit: pagination.limit,
          total: response.data.length,
          totalPages: 1
        });
      } else {
        setError('Erreur lors du chargement des entrees');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors du chargement des entrees');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.limit]);

  /**
   * Refresh entries (current page)
   */
  const refresh = useCallback(() => {
    fetchEntries(pagination.page);
  }, [fetchEntries, pagination.page]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchEntries(pagination.page + 1);
    }
  }, [fetchEntries, pagination.page, pagination.totalPages]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchEntries(pagination.page - 1);
    }
  }, [fetchEntries, pagination.page]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchEntries(page);
    }
  }, [fetchEntries, pagination.totalPages]);

  /**
   * Group entries by date
   * @returns {Object} Entries grouped by date string (YYYY-MM-DD)
   */
  const getGroupedEntries = useCallback(() => {
    const grouped = {};
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    entries.forEach((entry) => {
      const dateKey = entry.startTime.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          label: dateKey === today ? "Aujourd'hui" : dateKey === yesterday ? 'Hier' : formatDateLabel(dateKey),
          isToday: dateKey === today,
          entries: []
        };
      }
      grouped[dateKey].entries.push(entry);
    });

    // Sort entries within each group by startTime descending
    Object.values(grouped).forEach((group) => {
      group.entries.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    });

    // Convert to array sorted by date descending
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchEntries(1);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchEntries]);

  return {
    // State
    entries,
    loading,
    error,
    pagination,

    // Computed
    groupedEntries: getGroupedEntries(),

    // Actions
    refresh,
    nextPage,
    prevPage,
    goToPage
  };
}

/**
 * Format a date string to a human-readable label
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date label
 */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

export default useTimeEntries;
