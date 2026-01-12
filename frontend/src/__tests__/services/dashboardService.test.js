// frontend/src/__tests__/services/dashboardService.test.js
// Story 6.3: Employee Dashboard KPIs Section - dashboardService Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../../services/dashboardService';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn()
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

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyDashboard', () => {
    it('calls the correct endpoint', async () => {
      api.get.mockResolvedValue({ data: mockDashboardData });

      await dashboardService.getMyDashboard();

      expect(api.get).toHaveBeenCalledWith('/dashboard/me');
    });

    it('returns the API response', async () => {
      api.get.mockResolvedValue({ data: mockDashboardData });

      const result = await dashboardService.getMyDashboard();

      expect(result).toEqual({ data: mockDashboardData });
    });

    it('propagates API errors', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(dashboardService.getMyDashboard()).rejects.toThrow('Network error');
    });
  });

  describe('getByProject', () => {
    it('calls the correct endpoint with default period', async () => {
      api.get.mockResolvedValue({ data: [] });

      await dashboardService.getByProject();

      expect(api.get).toHaveBeenCalledWith('/dashboard/me/by-project?period=week');
    });

    it('calls the correct endpoint with custom period', async () => {
      api.get.mockResolvedValue({ data: [] });

      await dashboardService.getByProject('month');

      expect(api.get).toHaveBeenCalledWith('/dashboard/me/by-project?period=month');
    });
  });

  describe('getByCategory', () => {
    it('calls the correct endpoint with default period', async () => {
      api.get.mockResolvedValue({ data: [] });

      await dashboardService.getByCategory();

      expect(api.get).toHaveBeenCalledWith('/dashboard/me/by-category?period=week');
    });

    it('calls the correct endpoint with custom period', async () => {
      api.get.mockResolvedValue({ data: [] });

      await dashboardService.getByCategory('year');

      expect(api.get).toHaveBeenCalledWith('/dashboard/me/by-category?period=year');
    });
  });

  describe('getTrend', () => {
    it('calls the correct endpoint with default days', async () => {
      api.get.mockResolvedValue({ data: [] });

      await dashboardService.getTrend();

      expect(api.get).toHaveBeenCalledWith('/dashboard/me/trend?days=30');
    });

    it('calls the correct endpoint with custom days', async () => {
      api.get.mockResolvedValue({ data: [] });

      await dashboardService.getTrend(7);

      expect(api.get).toHaveBeenCalledWith('/dashboard/me/trend?days=7');
    });
  });
});
