// frontend/src/services/dashboardService.js
// Story 6.3: Employee Dashboard KPIs Section - Dashboard API Service

import api from '../lib/api';

/**
 * Dashboard service for employee dashboard data
 * Handles all API calls to /dashboard endpoints
 */
export const dashboardService = {
  /**
   * Get current user's dashboard data
   * Includes summary, comparison, and timesheet status
   * @returns {Promise<Object>} Dashboard data
   */
  getMyDashboard: () => {
    return api.get('/dashboard/me');
  },

  /**
   * Get hours breakdown by project for current user
   * @param {string} period - 'week' | 'month' | 'year'
   * @returns {Promise<Object>} Hours by project data
   */
  getByProject: (period = 'week') => {
    return api.get(`/dashboard/me/by-project?period=${period}`);
  },

  /**
   * Get hours breakdown by category for current user
   * @param {string} period - 'week' | 'month' | 'year'
   * @returns {Promise<Object>} Hours by category data
   */
  getByCategory: (period = 'week') => {
    return api.get(`/dashboard/me/by-category?period=${period}`);
  },

  /**
   * Get daily hours trend for current user
   * @param {number} days - Number of days to include (default: 30)
   * @returns {Promise<Object>} Daily trend data
   */
  getTrend: (days = 30) => {
    return api.get(`/dashboard/me/trend?days=${days}`);
  }
};

export default dashboardService;
