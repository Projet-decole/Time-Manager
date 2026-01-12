// frontend/src/__tests__/components/features/time-tracking/day-mode/DayModeView.test.jsx
// Story 4.7: Day Mode UI with Timeline - DayModeView Component Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DayModeView } from '../../../../../components/features/time-tracking/day-mode/DayModeView';

// Mock the hooks
vi.mock('../../../../../hooks/useDayMode', () => ({
  useDayMode: vi.fn()
}));

vi.mock('../../../../../hooks/useDayBlocks', () => ({
  useDayBlocks: vi.fn()
}));

vi.mock('../../../../../hooks/useProjects', () => ({
  useProjects: vi.fn(() => ({ projects: [], loading: false }))
}));

vi.mock('../../../../../hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({ categories: [], loading: false }))
}));

vi.mock('../../../../../components/ui/Toast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }))
}));

import { useDayMode } from '../../../../../hooks/useDayMode';
import { useDayBlocks } from '../../../../../hooks/useDayBlocks';

describe('DayModeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useDayBlocks
    useDayBlocks.mockReturnValue({
      createBlock: vi.fn(),
      updateBlock: vi.fn(),
      deleteBlock: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      clearError: vi.fn()
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loader while loading', () => {
      useDayMode.mockReturnValue({
        activeDay: null,
        blocks: [],
        completedDays: [],
        isLoading: true,
        isStartingDay: false,
        isEndingDay: false,
        hasActiveDay: false,
        error: null,
        startDay: vi.fn(),
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => null),
        clearError: vi.fn()
      });

      render(<DayModeView />);

      // Should show skeleton loaders (animated pulse elements)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('No Active Day State', () => {
    beforeEach(() => {
      useDayMode.mockReturnValue({
        activeDay: null,
        blocks: [],
        completedDays: [],
        isLoading: false,
        isStartingDay: false,
        isEndingDay: false,
        hasActiveDay: false,
        error: null,
        startDay: vi.fn(),
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => null),
        clearError: vi.fn()
      });
    });

    it('shows start day button when no active day', () => {
      render(<DayModeView />);

      expect(screen.getByText('DEMARRER LA JOURNEE')).toBeInTheDocument();
    });

    it('shows empty state message', () => {
      render(<DayModeView />);

      expect(screen.getByText('Aucune journee en cours')).toBeInTheDocument();
    });

    it('calls startDay when button is clicked', async () => {
      const startDay = vi.fn().mockResolvedValue({});
      useDayMode.mockReturnValue({
        activeDay: null,
        blocks: [],
        completedDays: [],
        isLoading: false,
        isStartingDay: false,
        isEndingDay: false,
        hasActiveDay: false,
        error: null,
        startDay,
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => null),
        clearError: vi.fn()
      });

      render(<DayModeView />);

      fireEvent.click(screen.getByText('DEMARRER LA JOURNEE'));

      await waitFor(() => {
        expect(startDay).toHaveBeenCalled();
      });
    });

    it('shows loading state while starting day', () => {
      useDayMode.mockReturnValue({
        activeDay: null,
        blocks: [],
        completedDays: [],
        isLoading: false,
        isStartingDay: true,
        isEndingDay: false,
        hasActiveDay: false,
        error: null,
        startDay: vi.fn(),
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => null),
        clearError: vi.fn()
      });

      render(<DayModeView />);

      // Start button should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Active Day State', () => {
    const mockActiveDay = {
      id: 'day-1',
      startTime: '2026-01-12T08:00:00Z',
      endTime: null
    };

    const mockBlocks = [
      {
        id: 'block-1',
        startTime: '2026-01-12T09:00:00Z',
        endTime: '2026-01-12T10:00:00Z',
        durationMinutes: 60
      }
    ];

    const mockStats = {
      totalMinutes: 120,
      allocatedMinutes: 60,
      unallocatedMinutes: 60,
      allocationPercentage: 50
    };

    beforeEach(() => {
      useDayMode.mockReturnValue({
        activeDay: mockActiveDay,
        blocks: mockBlocks,
        completedDays: [],
        isLoading: false,
        isStartingDay: false,
        isEndingDay: false,
        hasActiveDay: true,
        error: null,
        startDay: vi.fn(),
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => mockStats),
        clearError: vi.fn()
      });
    });

    it('shows day header when active day exists', () => {
      render(<DayModeView />);

      expect(screen.getByText(/Journee du/i)).toBeInTheDocument();
    });

    it('shows end day button', () => {
      render(<DayModeView />);

      expect(screen.getByText('Terminer la journee')).toBeInTheDocument();
    });

    it('shows timeline', () => {
      render(<DayModeView />);

      // Timeline should have the add block button
      expect(screen.getByText('+ Ajouter un bloc')).toBeInTheDocument();
    });

    it('calls endDay when end button is clicked', async () => {
      const endDay = vi.fn().mockResolvedValue({ id: 'day-1', endTime: new Date().toISOString() });
      useDayMode.mockReturnValue({
        activeDay: mockActiveDay,
        blocks: mockBlocks,
        completedDays: [],
        isLoading: false,
        isStartingDay: false,
        isEndingDay: false,
        hasActiveDay: true,
        error: null,
        startDay: vi.fn(),
        endDay,
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => mockStats),
        clearError: vi.fn()
      });

      render(<DayModeView />);

      fireEvent.click(screen.getByText('Terminer la journee'));

      await waitFor(() => {
        expect(endDay).toHaveBeenCalled();
      });
    });

    it('shows loading state while ending day', () => {
      useDayMode.mockReturnValue({
        activeDay: mockActiveDay,
        blocks: mockBlocks,
        completedDays: [],
        isLoading: false,
        isStartingDay: false,
        isEndingDay: true,
        hasActiveDay: true,
        error: null,
        startDay: vi.fn(),
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => mockStats),
        clearError: vi.fn()
      });

      render(<DayModeView />);

      expect(screen.getByText('Finalisation...')).toBeInTheDocument();
    });
  });

  describe('Block Modal', () => {
    const mockActiveDay = {
      id: 'day-1',
      startTime: '2026-01-12T08:00:00Z',
      endTime: null
    };

    beforeEach(() => {
      useDayMode.mockReturnValue({
        activeDay: mockActiveDay,
        blocks: [],
        completedDays: [],
        isLoading: false,
        isStartingDay: false,
        isEndingDay: false,
        hasActiveDay: true,
        error: null,
        startDay: vi.fn(),
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => ({ totalMinutes: 60, allocatedMinutes: 0, unallocatedMinutes: 60, allocationPercentage: 0 })),
        clearError: vi.fn()
      });
    });

    it('opens block modal when add button is clicked', async () => {
      render(<DayModeView />);

      fireEvent.click(screen.getByText('+ Ajouter un bloc'));

      await waitFor(() => {
        expect(screen.getByText('Nouveau bloc')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error toast when day error occurs', () => {
      const clearError = vi.fn();
      useDayMode.mockReturnValue({
        activeDay: null,
        blocks: [],
        completedDays: [],
        isLoading: false,
        isStartingDay: false,
        isEndingDay: false,
        hasActiveDay: false,
        error: 'Test error',
        startDay: vi.fn(),
        endDay: vi.fn(),
        refreshBlocks: vi.fn(),
        getDayStats: vi.fn(() => null),
        clearError
      });

      render(<DayModeView />);

      // Error should trigger clearError after being shown
      expect(clearError).toHaveBeenCalled();
    });
  });
});
