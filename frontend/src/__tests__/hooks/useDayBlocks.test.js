// frontend/src/__tests__/hooks/useDayBlocks.test.js
// Story 4.7: Day Mode UI with Timeline - useDayBlocks Hook Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDayBlocks } from '../../hooks/useDayBlocks';
import * as timeEntriesService from '../../services/timeEntriesService';

// Mock the timeEntriesService
vi.mock('../../services/timeEntriesService', () => ({
  timeEntriesService: {
    createDayBlock: vi.fn(),
    updateDayBlock: vi.fn(),
    deleteDayBlock: vi.fn()
  }
}));

describe('useDayBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('starts with no loading or error state', () => {
      const { result } = renderHook(() => useDayBlocks());

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('createBlock', () => {
    it('calls API and triggers refresh callback on success', async () => {
      const mockBlock = {
        id: 'block-1',
        startTime: '2026-01-12T09:00:00Z',
        endTime: '2026-01-12T10:00:00Z',
        durationMinutes: 60
      };

      const onBlocksChange = vi.fn();

      timeEntriesService.timeEntriesService.createDayBlock.mockResolvedValue({
        success: true,
        data: mockBlock
      });

      const { result } = renderHook(() => useDayBlocks(onBlocksChange));

      const blockData = {
        startTime: '2026-01-12T09:00:00Z',
        endTime: '2026-01-12T10:00:00Z',
        projectId: 'proj-1'
      };

      let createdBlock;
      await act(async () => {
        createdBlock = await result.current.createBlock(blockData);
      });

      expect(timeEntriesService.timeEntriesService.createDayBlock).toHaveBeenCalledWith(blockData);
      expect(createdBlock).toEqual(mockBlock);
      expect(onBlocksChange).toHaveBeenCalled();
    });

    it('sets isCreating during API call', async () => {
      let resolveCreate;
      const createPromise = new Promise(resolve => {
        resolveCreate = resolve;
      });

      timeEntriesService.timeEntriesService.createDayBlock.mockReturnValue(createPromise);

      const { result } = renderHook(() => useDayBlocks());

      let createPromiseResult;
      act(() => {
        createPromiseResult = result.current.createBlock({
          startTime: '2026-01-12T09:00:00Z',
          endTime: '2026-01-12T10:00:00Z'
        });
      });

      expect(result.current.isCreating).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveCreate({ success: true, data: { id: 'block-1' } });
        await createPromiseResult;
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles API error when creating', async () => {
      const createError = new Error('Create failed');
      timeEntriesService.timeEntriesService.createDayBlock.mockRejectedValue(createError);

      const { result } = renderHook(() => useDayBlocks());

      let caughtError;
      await act(async () => {
        try {
          await result.current.createBlock({
            startTime: '2026-01-12T09:00:00Z',
            endTime: '2026-01-12T10:00:00Z'
          });
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBe(createError);
      expect(result.current.error).toBe('Create failed');
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('updateBlock', () => {
    it('calls API and triggers refresh callback on success', async () => {
      const mockBlock = {
        id: 'block-1',
        startTime: '2026-01-12T09:00:00Z',
        endTime: '2026-01-12T11:00:00Z',
        durationMinutes: 120
      };

      const onBlocksChange = vi.fn();

      timeEntriesService.timeEntriesService.updateDayBlock.mockResolvedValue({
        success: true,
        data: mockBlock
      });

      const { result } = renderHook(() => useDayBlocks(onBlocksChange));

      const updateData = {
        endTime: '2026-01-12T11:00:00Z'
      };

      let updatedBlock;
      await act(async () => {
        updatedBlock = await result.current.updateBlock('block-1', updateData);
      });

      expect(timeEntriesService.timeEntriesService.updateDayBlock).toHaveBeenCalledWith('block-1', updateData);
      expect(updatedBlock).toEqual(mockBlock);
      expect(onBlocksChange).toHaveBeenCalled();
    });

    it('sets isUpdating during API call', async () => {
      let resolveUpdate;
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });

      timeEntriesService.timeEntriesService.updateDayBlock.mockReturnValue(updatePromise);

      const { result } = renderHook(() => useDayBlocks());

      let updatePromiseResult;
      act(() => {
        updatePromiseResult = result.current.updateBlock('block-1', { endTime: '2026-01-12T11:00:00Z' });
      });

      expect(result.current.isUpdating).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveUpdate({ success: true, data: { id: 'block-1' } });
        await updatePromiseResult;
      });

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles API error when updating', async () => {
      const updateError = new Error('Update failed');
      timeEntriesService.timeEntriesService.updateDayBlock.mockRejectedValue(updateError);

      const { result } = renderHook(() => useDayBlocks());

      let caughtError;
      await act(async () => {
        try {
          await result.current.updateBlock('block-1', { endTime: '2026-01-12T11:00:00Z' });
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBe(updateError);
      expect(result.current.error).toBe('Update failed');
      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('deleteBlock', () => {
    it('calls API and triggers refresh callback on success', async () => {
      const onBlocksChange = vi.fn();

      timeEntriesService.timeEntriesService.deleteDayBlock.mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useDayBlocks(onBlocksChange));

      await act(async () => {
        await result.current.deleteBlock('block-1');
      });

      expect(timeEntriesService.timeEntriesService.deleteDayBlock).toHaveBeenCalledWith('block-1');
      expect(onBlocksChange).toHaveBeenCalled();
    });

    it('sets isDeleting during API call', async () => {
      let resolveDelete;
      const deletePromise = new Promise(resolve => {
        resolveDelete = resolve;
      });

      timeEntriesService.timeEntriesService.deleteDayBlock.mockReturnValue(deletePromise);

      const { result } = renderHook(() => useDayBlocks());

      let deletePromiseResult;
      act(() => {
        deletePromiseResult = result.current.deleteBlock('block-1');
      });

      expect(result.current.isDeleting).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveDelete({ success: true });
        await deletePromiseResult;
      });

      expect(result.current.isDeleting).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles API error when deleting', async () => {
      const deleteError = new Error('Delete failed');
      timeEntriesService.timeEntriesService.deleteDayBlock.mockRejectedValue(deleteError);

      const { result } = renderHook(() => useDayBlocks());

      let caughtError;
      await act(async () => {
        try {
          await result.current.deleteBlock('block-1');
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBe(deleteError);
      expect(result.current.error).toBe('Delete failed');
      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      const deleteError = new Error('Test error');
      timeEntriesService.timeEntriesService.deleteDayBlock.mockRejectedValue(deleteError);

      const { result } = renderHook(() => useDayBlocks());

      await act(async () => {
        try {
          await result.current.deleteBlock('block-1');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
