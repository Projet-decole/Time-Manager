// frontend/src/hooks/useTemplate.js
// Story 4.10: Implement Template Mode UI - Single Template CRUD Hook

import { useState, useCallback, useRef } from 'react';
import templatesService from '../services/templatesService';

/**
 * Hook for single template CRUD operations
 * Story 4.10: Template Mode UI
 *
 * @param {function} [onSuccess] - Callback on successful operation
 * @returns {Object} Template state and actions
 */
export function useTemplate(onSuccess) {
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Template data
   */
  const getById = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await templatesService.getById(id);

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        setTemplate(response.data);
        return response.data;
      }

      throw new Error('Template non trouve');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors du chargement du template');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Create a new template
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Created template data
   */
  const create = useCallback(async (data) => {
    try {
      setIsCreating(true);
      setError(null);
      const response = await templatesService.create(data);

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        if (onSuccess) onSuccess();
        return response.data;
      }

      throw new Error('Erreur lors de la creation du template');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors de la creation du template');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false);
      }
    }
  }, [onSuccess]);

  /**
   * Update a template
   * @param {string} id - Template ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated template data
   */
  const update = useCallback(async (id, data) => {
    try {
      setIsUpdating(true);
      setError(null);
      const response = await templatesService.update(id, data);

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        setTemplate(response.data);
        if (onSuccess) onSuccess();
        return response.data;
      }

      throw new Error('Erreur lors de la mise a jour du template');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors de la mise a jour du template');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [onSuccess]);

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<void>}
   */
  const remove = useCallback(async (id) => {
    try {
      setIsDeleting(true);
      setError(null);
      await templatesService.delete(id);

      if (!isMountedRef.current) return;

      setTemplate(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors de la suppression du template');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
    }
  }, [onSuccess]);

  /**
   * Apply a template to a date
   * @param {string} id - Template ID
   * @param {string} date - Target date (YYYY-MM-DD)
   * @returns {Promise<Object>} Applied template result
   */
  const apply = useCallback(async (id, date) => {
    try {
      setIsApplying(true);
      setError(null);
      const response = await templatesService.apply(id, { date });

      if (!isMountedRef.current) return response;

      return response;
    } catch (err) {
      if (isMountedRef.current) {
        // Handle specific error codes
        if (err.code === 'DATE_HAS_ENTRIES') {
          setError('Cette date contient deja des entrees');
        } else if (err.code === 'TEMPLATE_EMPTY') {
          setError('Le template ne contient aucun bloc');
        } else {
          setError(err.message || 'Erreur lors de l\'application du template');
        }
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsApplying(false);
      }
    }
  }, []);

  /**
   * Create a template from an existing day
   * @param {string} dayId - Day entry ID
   * @param {Object} data - Template data (name, description)
   * @returns {Promise<Object>} Created template data
   */
  const createFromDay = useCallback(async (dayId, data) => {
    try {
      setIsCreating(true);
      setError(null);
      const response = await templatesService.createFromDay(dayId, data);

      if (!isMountedRef.current) return response.data;

      if (response.success && response.data) {
        if (onSuccess) onSuccess();
        return response.data;
      }

      throw new Error('Erreur lors de la creation du template depuis la journee');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors de la creation du template');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false);
      }
    }
  }, [onSuccess]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset template state
   */
  const reset = useCallback(() => {
    setTemplate(null);
    setError(null);
  }, []);

  return {
    template,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isApplying,
    isBusy: isLoading || isCreating || isUpdating || isDeleting || isApplying,
    error,
    getById,
    create,
    update,
    remove,
    apply,
    createFromDay,
    clearError,
    reset
  };
}

export default useTemplate;
