// frontend/src/__tests__/hooks/useDashboard.test.js
// Story 6.3: Employee Dashboard KPIs Section - useDashboard Hook Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useDashboard,
  useDashboardByProject,
  useDashboardByCategory,
  useDashboardTrend
} from '../../hooks/useDashboard';
import * as dashboardService from '../../services/dashboardService';

// Mock the dashboardService
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getMyDashboard: vi.fn(),
    getByProject: vi.fn(),
    getByCategory: vi.fn(),
    getTrend: vi.fn()
  }
}));

const mockDashboardData = {
  summary: {
    hoursThisWeek: 32.5,
    hoursThisMonth: 120,
    weeklyTarget: 35,
    monthlyTarget: 140
  },
  comparison: {
    weekOverWeek: 12.5,
    monthOverMonth: -5.2
  },
  timesheetStatus: {
    current: 'draft',
    validated: 3,
    pending: 1,
    currentWeekStart: '2024-01-15'
  }
};

const mockByProjectData = [
  { projectId: '1', projectName: 'Project A', hours: 15 },
  { projectId: '2', projectName: 'Project B', hours: 10 }
];

const mockByCategoryData = [
  { categoryId: '1', categoryName: 'Development', hours: 20 },
  { categoryId: '2', categoryName: 'Meetings', hours: 5 }
];

const mockTrendData = [
  { date: '2024-01-10', hours: 7 },
  { date: '2024-01-11', hours: 8 },
  { date: '2024-01-12', hours: 6 }
];

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('starts with loading true', () => {
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });
      dashboardService.dashboardService.getMyDashboard.mockReturnValue(pendingPromise);

      const { result, unmount } = renderHook(() => useDashboard());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      // Clean up
      resolvePromise({ data: mockDashboardData });
      unmount();
    });
  });

  describe('Fetching Data', () => {
    it('fetches dashboard data on mount', async () => {
      dashboardService.dashboardService.getMyDashboard.mockResolvedValue({
        data: mockDashboardData
      });

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(dashboardService.dashboardService.getMyDashboard).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockDashboardData);
      expect(result.current.error).toBeNull();
    });

    it('handles API error', async () => {
      dashboardService.dashboardService.getMyDashboard.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.data).toBeNull();
    });
  });

  describe('Refetch', () => {
    it('refetches dashboard data when refetch is called', async () => {
      dashboardService.dashboardService.getMyDashboard.mockResolvedValue({
        data: mockDashboardData
      });

      const { result } = renderHook(() => useDashboard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();
      dashboardService.dashboardService.getMyDashboard.mockResolvedValue({
        data: { ...mockDashboardData, summary: { ...mockDashboardData.summary, hoursThisWeek: 40 } }
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(dashboardService.dashboardService.getMyDashboard).toHaveBeenCalledTimes(1);
      expect(result.current.data.summary.hoursThisWeek).toBe(40);
    });
  });
});

describe('useDashboardByProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches by project data with default period', async () => {
    dashboardService.dashboardService.getByProject.mockResolvedValue({
      data: mockByProjectData
    });

    const { result } = renderHook(() => useDashboardByProject());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(dashboardService.dashboardService.getByProject).toHaveBeenCalledWith('week');
    expect(result.current.data).toEqual(mockByProjectData);
  });

  it('fetches by project data with custom period', async () => {
    dashboardService.dashboardService.getByProject.mockResolvedValue({
      data: mockByProjectData
    });

    const { result } = renderHook(() => useDashboardByProject('month'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(dashboardService.dashboardService.getByProject).toHaveBeenCalledWith('month');
  });

  it('handles API error', async () => {
    dashboardService.dashboardService.getByProject.mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useDashboardByProject());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.data).toBeNull();
  });
});

describe('useDashboardByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches by category data with default period', async () => {
    dashboardService.dashboardService.getByCategory.mockResolvedValue({
      data: mockByCategoryData
    });

    const { result } = renderHook(() => useDashboardByCategory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(dashboardService.dashboardService.getByCategory).toHaveBeenCalledWith('week');
    expect(result.current.data).toEqual(mockByCategoryData);
  });

  it('fetches by category data with custom period', async () => {
    dashboardService.dashboardService.getByCategory.mockResolvedValue({
      data: mockByCategoryData
    });

    const { result } = renderHook(() => useDashboardByCategory('year'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(dashboardService.dashboardService.getByCategory).toHaveBeenCalledWith('year');
  });

  it('handles API error', async () => {
    dashboardService.dashboardService.getByCategory.mockRejectedValue(
      new Error('Category error')
    );

    const { result } = renderHook(() => useDashboardByCategory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Category error');
  });
});

describe('useDashboardTrend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches trend data with default days', async () => {
    dashboardService.dashboardService.getTrend.mockResolvedValue({
      data: mockTrendData
    });

    const { result } = renderHook(() => useDashboardTrend());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(dashboardService.dashboardService.getTrend).toHaveBeenCalledWith(30);
    expect(result.current.data).toEqual(mockTrendData);
  });

  it('fetches trend data with custom days', async () => {
    dashboardService.dashboardService.getTrend.mockResolvedValue({
      data: mockTrendData
    });

    const { result } = renderHook(() => useDashboardTrend(7));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(dashboardService.dashboardService.getTrend).toHaveBeenCalledWith(7);
  });

  it('handles API error', async () => {
    dashboardService.dashboardService.getTrend.mockRejectedValue(
      new Error('Trend error')
    );

    const { result } = renderHook(() => useDashboardTrend());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Trend error');
  });
});
