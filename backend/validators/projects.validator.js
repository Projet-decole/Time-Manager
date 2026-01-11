// backend/validators/projects.validator.js

const { z } = require('zod');
const { validate, validateUUID } = require('../utils/validation');

/**
 * Create project request validation schema
 * Story 3.3: Projects CRUD API - AC1
 * - name: required, non-empty string (1-100 chars)
 * - description: optional, max 500 chars
 * - budgetHours: optional, number >= 0
 */
const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  budgetHours: z
    .number()
    .min(0, 'Budget hours must be 0 or greater')
    .optional()
    .nullable()
});

/**
 * Update project request validation schema
 * Story 3.3: Projects CRUD API - AC4
 * - name: optional, non-empty string (1-100 chars)
 * - description: optional, max 500 chars (can be null to clear)
 * - budgetHours: optional, number >= 0 (can be null to clear)
 * - code is immutable and not allowed in updates
 * At least one field must be provided
 */
const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  budgetHours: z
    .number()
    .min(0, 'Budget hours must be 0 or greater')
    .optional()
    .nullable()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  validate,
  validateUUID
};
