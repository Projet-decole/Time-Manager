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

/**
 * Create user request validation schema (manager only)
 * Story 2.14: Manager User Management
 * - email: required, valid email format
 * - firstName: required, non-empty string (max 100 chars)
 * - lastName: required, non-empty string (max 100 chars)
 * - role: optional, defaults to 'employee', must be 'employee' or 'manager'
 * - weeklyHoursTarget: optional, defaults to 35, number between 0-168
 */
const createUserSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name cannot be empty')
    .max(100, 'First name cannot exceed 100 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name cannot exceed 100 characters'),
  role: z
    .enum(['employee', 'manager'], { errorMap: () => ({ message: 'Role must be employee or manager' }) })
    .default('employee'),
  weeklyHoursTarget: z
    .number({ invalid_type_error: 'Weekly hours target must be a number' })
    .min(0, 'Weekly hours target must be at least 0')
    .max(168, 'Weekly hours target cannot exceed 168')
    .default(35)
});

/**
 * Update user request validation schema (manager only)
 * Story 2.14: Manager User Management
 * - firstName: optional, non-empty string (max 100 chars)
 * - lastName: optional, non-empty string (max 100 chars)
 * - weeklyHoursTarget: optional, number between 0-168
 * At least one field must be provided
 */
const updateUserSchema = z.object({
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
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

module.exports = {
  updateProfileSchema,
  createUserSchema,
  updateUserSchema,
  validate
};
