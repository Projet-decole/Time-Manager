// frontend/src/hooks/useCategories.js
// Story 3.8: Admin Management UI - Categories

import { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesService } from '../services/categoriesService';

/**
 * Hook for managing categories data and operations
 * Story 3.8: Admin Management UI - Categories
 * @param {Object} options - Hook options
 * @param {boolean} [options.includeInactive=false] - Include inactive categories in fetch
 * @returns {Object} Categories state and operations
 */
export function useCategories({ includeInactive = false } = {}) {
  const [state, setState] = useState({
    categories: [],
    loading: true,
    error: null
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  /**
   * Fetch categories from API
   * Uses isMountedRef to prevent state updates after unmount (M2 fix)
   */
  const fetchCategories = useCallback(async (showInactive = includeInactive) => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const response = await categoriesService.getAll({ includeInactive: showInactive });

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (response.success) {
        setState({
          categories: response.data,
          loading: false,
          error: null
        });
      } else {
        setState(s => ({
          ...s,
          loading: false,
          error: response.error || 'Erreur lors du chargement des categories'
        }));
      }
    } catch (err) {
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      setState(s => ({
        ...s,
        loading: false,
        error: err.message || 'Erreur lors du chargement des categories'
      }));
    }
  }, [includeInactive]);

  /**
   * Create a new category
   * Throws on API error for caller to handle (M3 fix)
   * @param {Object} categoryData - Category data to create
   * @returns {Promise<Object>} Created category
   * @throws {Error} When creation fails
   */
  const createCategory = useCallback(async (categoryData) => {
    const response = await categoriesService.create(categoryData);
    if (!response.success) {
      const error = new Error(response.error || 'Erreur lors de la creation');
      error.code = response.code;
      throw error;
    }
    // Refresh the list
    await fetchCategories();
    return response;
  }, [fetchCategories]);

  /**
   * Update an existing category
   * Throws on API error for caller to handle (M3 fix)
   * @param {string} id - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category
   * @throws {Error} When update fails
   */
  const updateCategory = useCallback(async (id, updateData) => {
    const response = await categoriesService.update(id, updateData);
    if (!response.success) {
      const error = new Error(response.error || 'Erreur lors de la modification');
      error.code = response.code;
      throw error;
    }
    // Refresh the list
    await fetchCategories();
    return response;
  }, [fetchCategories]);

  /**
   * Deactivate a category
   * Throws on API error for caller to handle (M3 fix)
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Response
   * @throws {Error} When deactivation fails
   */
  const deactivateCategory = useCallback(async (id) => {
    const response = await categoriesService.deactivate(id);
    if (!response.success) {
      const error = new Error(response.error || 'Erreur lors de la desactivation');
      error.code = response.code;
      throw error;
    }
    // Refresh the list
    await fetchCategories();
    return response;
  }, [fetchCategories]);

  /**
   * Activate a category
   * Throws on API error for caller to handle (M3 fix)
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Response
   * @throws {Error} When activation fails
   */
  const activateCategory = useCallback(async (id) => {
    const response = await categoriesService.activate(id);
    if (!response.success) {
      const error = new Error(response.error || 'Erreur lors de l\'activation');
      error.code = response.code;
      throw error;
    }
    // Refresh the list
    await fetchCategories();
    return response;
  }, [fetchCategories]);

  // Fetch categories on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    fetchCategories();

    // Cleanup: mark as unmounted to prevent state updates
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCategories]);

  return {
    ...state,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deactivateCategory,
    activateCategory
  };
}

export default useCategories;
