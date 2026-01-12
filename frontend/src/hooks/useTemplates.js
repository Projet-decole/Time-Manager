// frontend/src/hooks/useTemplates.js
// Story 4.10: Implement Template Mode UI - Templates List Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import templatesService from '../services/templatesService';

/**
 * Hook for managing templates list
 * Story 4.10: Template Mode UI
 *
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Object} Templates state and actions
 */
export function useTemplates(options = {}) {
  const { page = 1, limit = 20 } = options;

  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const isMountedRef = useRef(true);

  /**
   * Fetch templates on mount and when options change
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await templatesService.getAll({ page, limit });

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        setTemplates(response.data || []);
        setPagination(response.meta?.pagination || null);
      } else {
        setTemplates([]);
        setPagination(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors du chargement des templates');
        setTemplates([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, limit]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTemplates();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTemplates]);

  /**
   * Refresh templates list
   */
  const refresh = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    templates,
    isLoading,
    error,
    pagination,
    refresh,
    clearError,
    hasTemplates: templates.length > 0
  };
}

export default useTemplates;
