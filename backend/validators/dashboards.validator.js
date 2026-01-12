// backend/validators/dashboards.validator.js

const { z } = require('zod');

/**
 * Query parameter schema for period-based endpoints
 * Used by /dashboard/me/by-project and /dashboard/me/by-category
 * Story 6.1: Employee Dashboard API - AC2, AC3
 */
const periodQuerySchema = z.object({
  period: z
    .enum(['week', 'month'], {
      invalid_type_error: 'Period must be either "week" or "month"'
    })
    .optional()
    .default('week')
}).strict();

/**
 * Query parameter schema for trend endpoint
 * Used by /dashboard/me/trend
 * Story 6.1: Employee Dashboard API - AC4
 */
const trendQuerySchema = z.object({
  days: z
    .string()
    .regex(/^\d+$/, 'Days must be a positive integer')
    .transform(Number)
    .refine(val => val >= 1 && val <= 365, {
      message: 'Days must be between 1 and 365'
    })
    .optional()
    .default(30)
}).strict();

module.exports = {
  periodQuerySchema,
  trendQuerySchema
};
