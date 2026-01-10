// backend/validators/users.validator.js

const { z } = require('zod');
const { validate } = require('../utils/validation');

/**
 * Update profile request validation schema
 * Validates firstName, lastName, and weeklyHoursTarget
 * - firstName: optional, non-empty string when provided (max 100 chars)
 * - lastName: optional, non-empty string when provided (max 100 chars)
 * - weeklyHoursTarget: optional, number between 0-168 (max hours in a week)
 */
const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name cannot exceed 100 characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name cannot exceed 100 characters')
    .optional(),
  weeklyHoursTarget: z
    .number({ invalid_type_error: 'Weekly hours target must be a number' })
    .min(0, 'Weekly hours target must be at least 0')
    .max(168, 'Weekly hours target cannot exceed 168')
    .optional()
});

module.exports = {
  updateProfileSchema,
  validate
};
