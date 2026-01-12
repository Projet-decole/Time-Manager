// frontend/src/__tests__/services/timeEntriesService.test.js
// Story 4.4: Simple Mode UI - Time Entries Service Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timeEntriesService } from '../../services/timeEntriesService';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

describe('timeEntriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches time entries with default pagination', async () => {
      const mockResponse = { success: true, data: [], meta: { pagination: { page: 1, limit: 20 } } };
      api.get.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.getAll();

      expect(api.get).toHaveBeenCalledWith('/time-entries?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('fetches time entries with custom pagination', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({ page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/time-entries?page=2&limit=10');
    });

    it('includes date filters when provided', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      await timeEntriesService.getAll({
        startDate: '2026-01-01',
        endDate: '2026-01-31'
      });

      expect(api.get).toHaveBeenCalledWith(
        '/time-entries?page=1&limit=20&startDate=2026-01-01&endDate=2026-01-31'
      );
    });
  });

  describe('getById', () => {
    it('fetches a single time entry by ID', async () => {
      const mockResponse = { success: true, data: { id: '1', startTime: '2026-01-12T10:00:00Z' } };
      api.get.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.getById('1');

      expect(api.get).toHaveBeenCalledWith('/time-entries/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getActive', () => {
    it('fetches the active timer', async () => {
      const mockResponse = { success: true, data: { id: '1', startTime: '2026-01-12T10:00:00Z' } };
      api.get.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.getActive();

      expect(api.get).toHaveBeenCalledWith('/time-entries/active');
      expect(result).toEqual(mockResponse);
    });

    it('returns null data when no active timer', async () => {
      const mockResponse = { success: true, data: null };
      api.get.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.getActive();

      expect(result.data).toBeNull();
    });
  });

  describe('startTimer', () => {
    it('starts a timer without options', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', startTime: '2026-01-12T10:00:00Z' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.startTimer();

      expect(api.post).toHaveBeenCalledWith('/time-entries/start', {});
      expect(result).toEqual(mockResponse);
    });

    it('starts a timer with project and category', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      await timeEntriesService.startTimer({
        projectId: 'proj-1',
        categoryId: 'cat-1',
        description: 'Test task'
      });

      expect(api.post).toHaveBeenCalledWith('/time-entries/start', {
        projectId: 'proj-1',
        categoryId: 'cat-1',
        description: 'Test task'
      });
    });

    it('excludes empty optional fields', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      await timeEntriesService.startTimer({
        projectId: 'proj-1',
        categoryId: '',
        description: ''
      });

      expect(api.post).toHaveBeenCalledWith('/time-entries/start', {
        projectId: 'proj-1'
      });
    });
  });

  describe('stopTimer', () => {
    it('stops the active timer without options', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', endTime: '2026-01-12T12:00:00Z', durationMinutes: 120 }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.stopTimer();

      expect(api.post).toHaveBeenCalledWith('/time-entries/stop', {});
      expect(result).toEqual(mockResponse);
    });

    it('stops the timer with updates', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      await timeEntriesService.stopTimer({
        projectId: 'proj-1',
        categoryId: 'cat-1',
        description: 'Updated description'
      });

      expect(api.post).toHaveBeenCalledWith('/time-entries/stop', {
        projectId: 'proj-1',
        categoryId: 'cat-1',
        description: 'Updated description'
      });
    });
  });

  describe('create', () => {
    it('creates a manual time entry', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      api.post.mockResolvedValue(mockResponse);

      await timeEntriesService.create({
        startTime: '2026-01-12T10:00:00Z',
        endTime: '2026-01-12T12:00:00Z',
        projectId: 'proj-1'
      });

      expect(api.post).toHaveBeenCalledWith('/time-entries', {
        startTime: '2026-01-12T10:00:00Z',
        endTime: '2026-01-12T12:00:00Z',
        projectId: 'proj-1'
      });
    });
  });

  describe('update', () => {
    it('updates a time entry', async () => {
      const mockResponse = { success: true, data: { id: '1', description: 'Updated' } };
      api.patch.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.update('1', { description: 'Updated' });

      expect(api.patch).toHaveBeenCalledWith('/time-entries/1', { description: 'Updated' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('deletes a time entry', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await timeEntriesService.delete('1');

      expect(api.delete).toHaveBeenCalledWith('/time-entries/1');
      expect(result).toEqual(mockResponse);
    });
  });

  // ========================================
  // Day Mode Tests (Story 4.7)
  // ========================================

  describe('Day Mode - Day Container', () => {
    describe('startDay', () => {
      it('starts a day without options', async () => {
        const mockResponse = {
          success: true,
          data: { id: 'day-1', startTime: '2026-01-12T08:00:00Z' }
        };
        api.post.mockResolvedValue(mockResponse);

        const result = await timeEntriesService.startDay();

        expect(api.post).toHaveBeenCalledWith('/time-entries/day/start', {});
        expect(result).toEqual(mockResponse);
      });

      it('starts a day with description', async () => {
        const mockResponse = { success: true, data: { id: 'day-1' } };
        api.post.mockResolvedValue(mockResponse);

        await timeEntriesService.startDay({ description: 'Work day' });

        expect(api.post).toHaveBeenCalledWith('/time-entries/day/start', {
          description: 'Work day'
        });
      });
    });

    describe('endDay', () => {
      it('ends the active day', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'day-1',
            startTime: '2026-01-12T08:00:00Z',
            endTime: '2026-01-12T17:00:00Z',
            durationMinutes: 540
          }
        };
        api.post.mockResolvedValue(mockResponse);

        const result = await timeEntriesService.endDay();

        expect(api.post).toHaveBeenCalledWith('/time-entries/day/end', {});
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getActiveDay', () => {
      it('fetches the active day with blocks', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'day-1',
            startTime: '2026-01-12T08:00:00Z',
            blocks: [{ id: 'block-1' }]
          }
        };
        api.get.mockResolvedValue(mockResponse);

        const result = await timeEntriesService.getActiveDay();

        expect(api.get).toHaveBeenCalledWith('/time-entries/day/active');
        expect(result).toEqual(mockResponse);
      });

      it('returns null data when no active day', async () => {
        const mockResponse = { success: true, data: null };
        api.get.mockResolvedValue(mockResponse);

        const result = await timeEntriesService.getActiveDay();

        expect(result.data).toBeNull();
      });
    });
  });

  describe('Day Mode - Time Blocks', () => {
    describe('getDayBlocks', () => {
      it('fetches blocks for the active day', async () => {
        const mockResponse = {
          success: true,
          data: [{ id: 'block-1' }, { id: 'block-2' }]
        };
        api.get.mockResolvedValue(mockResponse);

        const result = await timeEntriesService.getDayBlocks();

        expect(api.get).toHaveBeenCalledWith('/time-entries/day/blocks');
        expect(result).toEqual(mockResponse);
      });
    });

    describe('createDayBlock', () => {
      it('creates a time block', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'block-1',
            startTime: '2026-01-12T09:00:00Z',
            endTime: '2026-01-12T10:00:00Z'
          }
        };
        api.post.mockResolvedValue(mockResponse);

        const blockData = {
          startTime: '2026-01-12T09:00:00Z',
          endTime: '2026-01-12T10:00:00Z',
          projectId: 'proj-1'
        };

        const result = await timeEntriesService.createDayBlock(blockData);

        expect(api.post).toHaveBeenCalledWith('/time-entries/day/blocks', blockData);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateDayBlock', () => {
      it('updates a time block', async () => {
        const mockResponse = {
          success: true,
          data: { id: 'block-1', endTime: '2026-01-12T11:00:00Z' }
        };
        api.patch.mockResolvedValue(mockResponse);

        const result = await timeEntriesService.updateDayBlock('block-1', {
          endTime: '2026-01-12T11:00:00Z'
        });

        expect(api.patch).toHaveBeenCalledWith('/time-entries/day/blocks/block-1', {
          endTime: '2026-01-12T11:00:00Z'
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('deleteDayBlock', () => {
      it('deletes a time block', async () => {
        const mockResponse = { success: true };
        api.delete.mockResolvedValue(mockResponse);

        const result = await timeEntriesService.deleteDayBlock('block-1');

        expect(api.delete).toHaveBeenCalledWith('/time-entries/day/blocks/block-1');
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('getByMode', () => {
    it('fetches time entries by entry mode', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      await timeEntriesService.getByMode({ entryMode: 'day' });

      expect(api.get).toHaveBeenCalledWith('/time-entries?page=1&limit=20&entryMode=day');
    });

    it('uses default pagination when not provided', async () => {
      const mockResponse = { success: true, data: [] };
      api.get.mockResolvedValue(mockResponse);

      await timeEntriesService.getByMode();

      expect(api.get).toHaveBeenCalledWith('/time-entries?page=1&limit=20');
    });
  });
});
