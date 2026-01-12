// backend/controllers/dashboards.controller.js

const dashboardsService = require('../services/dashboards.service');
const { successResponse } = require('../utils/response');

/**
 * Get employee dashboard summary
 * @route GET /api/v1/dashboard/me
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response
 * Story 6.1: Employee Dashboard API - AC1
 */
const getMyDashboard = async (req, res) => {
  const userId = req.user.id;
  const data = await dashboardsService.getEmployeeDashboard(userId);
  return successResponse(res, data);
};

/**
 * Get hours breakdown by project
 * @route GET /api/v1/dashboard/me/by-project
 * @param {Request} req - Express request with query.period
 * @param {Response} res - Express response
 * Story 6.1: Employee Dashboard API - AC2
 */
const getMyByProject = async (req, res) => {
  const userId = req.user.id;
  const period = req.validatedQuery?.period || req.query.period || 'week';
  const data = await dashboardsService.getByProject(userId, period);
  return successResponse(res, data);
};

/**
 * Get hours breakdown by category
 * @route GET /api/v1/dashboard/me/by-category
 * @param {Request} req - Express request with query.period
 * @param {Response} res - Express response
 * Story 6.1: Employee Dashboard API - AC3
 */
const getMyByCategory = async (req, res) => {
  const userId = req.user.id;
  const period = req.validatedQuery?.period || req.query.period || 'week';
  const data = await dashboardsService.getByCategory(userId, period);
  return successResponse(res, data);
};

/**
 * Get daily hours trend for line chart
 * @route GET /api/v1/dashboard/me/trend
 * @param {Request} req - Express request with query.days
 * @param {Response} res - Express response
 * Story 6.1: Employee Dashboard API - AC4
 */
const getMyTrend = async (req, res) => {
  const userId = req.user.id;
  const days = req.validatedQuery?.days || parseInt(req.query.days) || 30;
  const data = await dashboardsService.getTrend(userId, days);
  return successResponse(res, data);
};

module.exports = {
  getMyDashboard,
  getMyByProject,
  getMyByCategory,
  getMyTrend
};
