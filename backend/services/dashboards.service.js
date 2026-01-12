// backend/services/dashboards.service.js

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');

/**
 * Helper: Format date as YYYY-MM-DD (timezone-safe)
 * @param {Date} date - Date object
 * @returns {string} Date string in 'YYYY-MM-DD' format
 */
const formatDateYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper: Get current week start (Monday)
 * @returns {string} Week start date in 'YYYY-MM-DD' format
 * Story 6.1: Employee Dashboard API - AC1
 */
const getCurrentWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return formatDateYMD(monday);
};

/**
 * Helper: Get current week end (Sunday)
 * @returns {string} Week end date in 'YYYY-MM-DD' format
 */
const getCurrentWeekEnd = () => {
  const weekStart = getCurrentWeekStart();
  const [year, month, day] = weekStart.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  startDate.setDate(startDate.getDate() + 6);
  return formatDateYMD(startDate);
};

/**
 * Helper: Get current month start
 * @returns {string} Month start date in 'YYYY-MM-DD' format
 * Story 6.1: Employee Dashboard API - AC1
 */
const getCurrentMonthStart = () => {
  const now = new Date();
  return formatDateYMD(new Date(now.getFullYear(), now.getMonth(), 1));
};

/**
 * Helper: Get current month end
 * @returns {string} Month end date in 'YYYY-MM-DD' format
 */
const getCurrentMonthEnd = () => {
  const now = new Date();
  return formatDateYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
};

/**
 * Helper: Get previous week start
 * @returns {string} Previous week start date in 'YYYY-MM-DD' format
 * Story 6.1: Employee Dashboard API - AC6
 */
const getPreviousWeekStart = () => {
  const weekStart = getCurrentWeekStart();
  const [year, month, day] = weekStart.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  startDate.setDate(startDate.getDate() - 7);
  return formatDateYMD(startDate);
};

/**
 * Helper: Get previous week end
 * @returns {string} Previous week end date in 'YYYY-MM-DD' format
 */
const getPreviousWeekEnd = () => {
  const prevWeekStart = getPreviousWeekStart();
  const [year, month, day] = prevWeekStart.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  startDate.setDate(startDate.getDate() + 6);
  return formatDateYMD(startDate);
};

/**
 * Helper: Get previous month start
 * @returns {string} Previous month start date in 'YYYY-MM-DD' format
 * Story 6.1: Employee Dashboard API - AC6
 */
const getPreviousMonthStart = () => {
  const now = new Date();
  return formatDateYMD(new Date(now.getFullYear(), now.getMonth() - 1, 1));
};

/**
 * Helper: Get previous month end
 * @returns {string} Previous month end date in 'YYYY-MM-DD' format
 */
const getPreviousMonthEnd = () => {
  const now = new Date();
  return formatDateYMD(new Date(now.getFullYear(), now.getMonth(), 0));
};

/**
 * Helper: Calculate hours in a date range for a user
 * @param {string} userId - User UUID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<number>} Total hours
 * Story 6.1: Employee Dashboard API - AC1
 */
const calculateHours = async (userId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', userId)
    .gte('start_time', `${startDate}T00:00:00Z`)
    .lte('start_time', `${endDate}T23:59:59Z`);

  if (error) {
    console.error('[DASHBOARDS] Calculate hours failed:', { error: error.message });
    throw new AppError('Failed to calculate hours', 500, 'DATABASE_ERROR');
  }

  return data.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
};

/**
 * Helper: Get period start/end dates
 * @param {string} period - 'week' or 'month'
 * @returns {Object} { startDate, endDate }
 * Story 6.1: Employee Dashboard API - AC2, AC3
 */
const getPeriodDates = (period) => {
  if (period === 'week') {
    return {
      startDate: getCurrentWeekStart(),
      endDate: getCurrentWeekEnd()
    };
  } else if (period === 'month') {
    return {
      startDate: getCurrentMonthStart(),
      endDate: getCurrentMonthEnd()
    };
  }
  throw new AppError('Invalid period. Must be "week" or "month"', 400, 'VALIDATION_ERROR');
};

/**
 * Get employee dashboard summary data
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Dashboard summary data
 * Story 6.1: Employee Dashboard API - AC1, AC5, AC6, AC7
 */
const getEmployeeDashboard = async (userId) => {
  // Get user profile for weekly target (AC5)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('weekly_hours_target')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('[DASHBOARDS] Get profile failed:', { error: profileError.message });
    throw new AppError('Failed to get user profile', 500, 'DATABASE_ERROR');
  }

  const weeklyTarget = profile?.weekly_hours_target || 35;
  const monthlyTarget = weeklyTarget * 4;

  // Calculate current week/month hours
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();
  const monthStart = getCurrentMonthStart();
  const now = new Date().toISOString().split('T')[0];

  const hoursThisWeek = await calculateHours(userId, weekStart, weekEnd);
  const hoursThisMonth = await calculateHours(userId, monthStart, now);

  // Calculate previous periods for comparison (AC6)
  const prevWeekStart = getPreviousWeekStart();
  const prevWeekEnd = getPreviousWeekEnd();
  const hoursLastWeek = await calculateHours(userId, prevWeekStart, prevWeekEnd);

  const prevMonthStart = getPreviousMonthStart();
  const prevMonthEnd = getPreviousMonthEnd();
  const hoursLastMonth = await calculateHours(userId, prevMonthStart, prevMonthEnd);

  // Calculate comparisons (AC6)
  const weekOverWeek = hoursLastWeek > 0
    ? ((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100
    : 0;
  const monthOverMonth = hoursLastMonth > 0
    ? ((hoursThisMonth - hoursLastMonth) / hoursLastMonth) * 100
    : 0;

  // Get timesheet status counts (AC7)
  const { data: timesheets, error: timesheetError } = await supabase
    .from('timesheets')
    .select('status, week_start')
    .eq('user_id', userId);

  if (timesheetError) {
    console.error('[DASHBOARDS] Get timesheets failed:', { error: timesheetError.message });
    // Don't throw, just use default values
  }

  const currentTimesheet = timesheets?.find(t => t.week_start === weekStart);
  const pending = timesheets?.filter(t => t.status === 'submitted').length || 0;
  const validated = timesheets?.filter(t => t.status === 'validated').length || 0;
  const rejected = timesheets?.filter(t => t.status === 'rejected').length || 0;

  return {
    summary: {
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      weeklyTarget,
      monthlyTarget,
      weeklyProgress: Math.round((hoursThisWeek / weeklyTarget) * 1000) / 10,
      monthlyProgress: Math.round((hoursThisMonth / monthlyTarget) * 1000) / 10
    },
    comparison: {
      weekOverWeek: Math.round(weekOverWeek * 10) / 10,
      monthOverMonth: Math.round(monthOverMonth * 10) / 10
    },
    timesheetStatus: {
      current: currentTimesheet?.status || 'none',
      currentWeekStart: weekStart,
      pending,
      validated,
      rejected
    }
  };
};

/**
 * Get hours breakdown by project for a period
 * @param {string} userId - User UUID
 * @param {string} period - 'week' or 'month'
 * @returns {Promise<Object>} Hours by project data
 * Story 6.1: Employee Dashboard API - AC2
 */
const getByProject = async (userId, period) => {
  const { startDate, endDate } = getPeriodDates(period);

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      duration_minutes,
      projects:project_id (id, name, code)
    `)
    .eq('user_id', userId)
    .gte('start_time', `${startDate}T00:00:00Z`)
    .lte('start_time', `${endDate}T23:59:59Z`);

  if (error) {
    console.error('[DASHBOARDS] Get by project failed:', { error: error.message });
    throw new AppError('Failed to get hours by project', 500, 'DATABASE_ERROR');
  }

  // Aggregate by project
  const byProject = {};
  let totalMinutes = 0;

  data.forEach(entry => {
    const projectId = entry.projects?.id || 'no-project';
    const projectName = entry.projects?.name || 'Sans projet';
    const projectCode = entry.projects?.code || '';

    if (!byProject[projectId]) {
      byProject[projectId] = {
        projectId,
        projectName,
        projectCode,
        minutes: 0
      };
    }
    byProject[projectId].minutes += entry.duration_minutes || 0;
    totalMinutes += entry.duration_minutes || 0;
  });

  const breakdown = Object.values(byProject).map(p => ({
    projectId: p.projectId,
    projectName: p.projectName,
    projectCode: p.projectCode,
    hours: Math.round(p.minutes / 6) / 10,
    percentage: totalMinutes > 0 ? Math.round((p.minutes / totalMinutes) * 1000) / 10 : 0
  })).sort((a, b) => b.hours - a.hours);

  return {
    period,
    periodStart: startDate,
    periodEnd: endDate,
    breakdown,
    totalHours: Math.round(totalMinutes / 6) / 10
  };
};

/**
 * Get hours breakdown by category for a period
 * @param {string} userId - User UUID
 * @param {string} period - 'week' or 'month'
 * @returns {Promise<Object>} Hours by category data
 * Story 6.1: Employee Dashboard API - AC3
 */
const getByCategory = async (userId, period) => {
  const { startDate, endDate } = getPeriodDates(period);

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      duration_minutes,
      categories:category_id (id, name)
    `)
    .eq('user_id', userId)
    .gte('start_time', `${startDate}T00:00:00Z`)
    .lte('start_time', `${endDate}T23:59:59Z`);

  if (error) {
    console.error('[DASHBOARDS] Get by category failed:', { error: error.message });
    throw new AppError('Failed to get hours by category', 500, 'DATABASE_ERROR');
  }

  // Aggregate by category
  const byCategory = {};
  let totalMinutes = 0;

  data.forEach(entry => {
    const categoryId = entry.categories?.id || 'no-category';
    const categoryName = entry.categories?.name || 'Sans categorie';

    if (!byCategory[categoryId]) {
      byCategory[categoryId] = {
        categoryId,
        categoryName,
        minutes: 0
      };
    }
    byCategory[categoryId].minutes += entry.duration_minutes || 0;
    totalMinutes += entry.duration_minutes || 0;
  });

  const breakdown = Object.values(byCategory).map(c => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    hours: Math.round(c.minutes / 6) / 10,
    percentage: totalMinutes > 0 ? Math.round((c.minutes / totalMinutes) * 1000) / 10 : 0
  })).sort((a, b) => b.hours - a.hours);

  return {
    period,
    periodStart: startDate,
    periodEnd: endDate,
    breakdown,
    totalHours: Math.round(totalMinutes / 6) / 10
  };
};

/**
 * Get daily hours trend for line chart
 * @param {string} userId - User UUID
 * @param {number} days - Number of days to include
 * @returns {Promise<Object>} Trend data
 * Story 6.1: Employee Dashboard API - AC4
 */
const getTrend = async (userId, days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  // Get daily target from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('weekly_hours_target')
    .eq('id', userId)
    .single();

  const dailyTarget = (profile?.weekly_hours_target || 35) / 5;

  const { data, error } = await supabase
    .from('time_entries')
    .select('start_time, duration_minutes')
    .eq('user_id', userId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString());

  if (error) {
    console.error('[DASHBOARDS] Get trend failed:', { error: error.message });
    throw new AppError('Failed to get trend data', 500, 'DATABASE_ERROR');
  }

  // Build daily map using local date formatting
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyMap = {};

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateYMD(d);
    dailyMap[dateStr] = {
      date: dateStr,
      minutes: 0,
      dayOfWeek: dayNames[d.getDay()]
    };
  }

  // Aggregate entries by day
  data.forEach(entry => {
    const dateStr = entry.start_time.split('T')[0];
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].minutes += entry.duration_minutes || 0;
    }
  });

  const trend = Object.values(dailyMap).map(d => ({
    date: d.date,
    hours: Math.round(d.minutes / 6) / 10,
    dayOfWeek: d.dayOfWeek
  }));

  const totalHours = trend.reduce((sum, d) => sum + d.hours, 0);
  const workDays = trend.filter(d => !['Saturday', 'Sunday'].includes(d.dayOfWeek)).length;

  return {
    period: {
      days,
      start: formatDateYMD(startDate),
      end: formatDateYMD(endDate)
    },
    dailyTarget: Math.round(dailyTarget * 10) / 10,
    trend,
    average: workDays > 0 ? Math.round((totalHours / workDays) * 10) / 10 : 0,
    total: Math.round(totalHours * 10) / 10
  };
};

module.exports = {
  getEmployeeDashboard,
  getByProject,
  getByCategory,
  getTrend,
  // Export helpers for testing
  getCurrentWeekStart,
  getCurrentWeekEnd,
  getCurrentMonthStart,
  getCurrentMonthEnd,
  getPreviousWeekStart,
  getPreviousWeekEnd,
  getPreviousMonthStart,
  getPreviousMonthEnd,
  getPeriodDates,
  calculateHours
};
