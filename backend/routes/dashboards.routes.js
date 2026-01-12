// backend/routes/dashboards.routes.js

const express = require('express');
const dashboardsController = require('../controllers/dashboards.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth.middleware');
const {
  periodQuerySchema,
  trendQuerySchema
} = require('../validators/dashboards.validator');

const router = express.Router();

/**
 * Middleware to validate query parameters with Zod schema
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const zodErrors = result.error.issues || result.error.errors || [];
      const errors = zodErrors.map(err => ({
        field: err.path.join('.') || err.path[0] || 'query',
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        }
      });
    }
    req.validatedQuery = result.data;
    next();
  };
};

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/dashboard/me
 * @desc    Get employee dashboard summary (hours, targets, comparisons, timesheet status)
 * @access  Private (requires authentication)
 * Story 6.1: Employee Dashboard API - AC1
 */
router.get('/me', asyncHandler(dashboardsController.getMyDashboard));

/**
 * @route   GET /api/v1/dashboard/me/by-project
 * @desc    Get hours breakdown by project for a period
 * @access  Private (requires authentication)
 * @query   period - 'week' or 'month' (default: 'week')
 * Story 6.1: Employee Dashboard API - AC2
 */
router.get('/me/by-project', validateQuery(periodQuerySchema), asyncHandler(dashboardsController.getMyByProject));

/**
 * @route   GET /api/v1/dashboard/me/by-category
 * @desc    Get hours breakdown by category for a period
 * @access  Private (requires authentication)
 * @query   period - 'week' or 'month' (default: 'week')
 * Story 6.1: Employee Dashboard API - AC3
 */
router.get('/me/by-category', validateQuery(periodQuerySchema), asyncHandler(dashboardsController.getMyByCategory));

/**
 * @route   GET /api/v1/dashboard/me/trend
 * @desc    Get daily hours trend for line chart
 * @access  Private (requires authentication)
 * @query   days - Number of days to include (default: 30, max: 365)
 * Story 6.1: Employee Dashboard API - AC4
 */
router.get('/me/trend', validateQuery(trendQuerySchema), asyncHandler(dashboardsController.getMyTrend));

module.exports = router;
