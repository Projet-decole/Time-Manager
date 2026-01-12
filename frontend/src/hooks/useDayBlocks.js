// frontend/src/hooks/useDayBlocks.js
// Story 4.7: Day Mode UI with Timeline - Day Blocks CRUD Hook

import { useState, useCallback } from 'react';
import { timeEntriesService } from '../services/timeEntriesService';

/**
 * Hook for managing day block CRUD operations
 * Story 4.7: Day Mode UI with Timeline
 *
 * @param {Function} [onBlocksChange] - Callback when blocks are modified
 * @returns {Object} Block operations and state
 */
export function useDayBlocks(onBlocksChange) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a new time block
   * @param {Object} blockData - Block data
   * @param {string} blockData.startTime - Start time (ISO string)
   * @param {string} blockData.endTime - End time (ISO string)
   * @param {string} [blockData.projectId] - Project ID
   * @param {string} [blockData.categoryId] - Category ID
   * @param {string} [blockData.description] - Description
   * @returns {Promise<Object>} Created block data
   */
  const createBlock = useCallback(async (blockData) => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await timeEntriesService.createDayBlock(blockData);

      if (response.success && response.data) {
        if (onBlocksChange) onBlocksChange();
        return response.data;
      }

      throw new Error('Echec de la creation du bloc');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [onBlocksChange]);

  /**
   * Update an existing time block
   * @param {string} blockId - Block ID
   * @param {Object} blockData - Data to update
   * @returns {Promise<Object>} Updated block data
   */
  const updateBlock = useCallback(async (blockId, blockData) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await timeEntriesService.updateDayBlock(blockId, blockData);

      if (response.success && response.data) {
        if (onBlocksChange) onBlocksChange();
        return response.data;
      }

      throw new Error('Echec de la mise a jour du bloc');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [onBlocksChange]);

  /**
   * Delete a time block
   * @param {string} blockId - Block ID
   * @returns {Promise<void>}
   */
  const deleteBlock = useCallback(async (blockId) => {
    try {
      setIsDeleting(true);
      setError(null);

      await timeEntriesService.deleteDayBlock(blockId);
      if (onBlocksChange) onBlocksChange();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [onBlocksChange]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createBlock,
    updateBlock,
    deleteBlock,
    isCreating,
    isUpdating,
    isDeleting,
    isLoading: isCreating || isUpdating || isDeleting,
    error,
    clearError
  };
}

export default useDayBlocks;
