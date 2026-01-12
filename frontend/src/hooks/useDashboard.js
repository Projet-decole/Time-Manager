// frontend/src/hooks/useDashboard.js
// Story 6.3: Employee Dashboard KPIs Section - Dashboard Hooks

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

/**
 * Hook for fetching the current user's dashboard data
 * @returns {Object} { data, loading, error, refetch }
 */
export const useDashboard = () => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const response = await dashboardService.getMyDashboard();
      setState({ data: response.data, loading: false, error: null });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

/**
 * Hook for fetching hours breakdown by project
 * @param {string} period - 'week' | 'month' | 'year'
 * @returns {Object} { data, loading, error }
 */
export const useDashboardByProject = (period = 'week') => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const response = await dashboardService.getByProject(period);
        setState({ data: response.data, loading: false, error: null });
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    };
    fetchData();
  }, [period]);

  return state;
};

/**
 * Hook for fetching hours breakdown by category
 * @param {string} period - 'week' | 'month' | 'year'
 * @returns {Object} { data, loading, error }
 */
export const useDashboardByCategory = (period = 'week') => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const response = await dashboardService.getByCategory(period);
        setState({ data: response.data, loading: false, error: null });
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    };
    fetchData();
  }, [period]);

  return state;
};

/**
 * Hook for fetching daily hours trend
 * @param {number} days - Number of days to include (default: 30)
 * @returns {Object} { data, loading, error }
 */
export const useDashboardTrend = (days = 30) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const response = await dashboardService.getTrend(days);
        setState({ data: response.data, loading: false, error: null });
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    };
    fetchData();
  }, [days]);

  return state;
};

export default useDashboard;
