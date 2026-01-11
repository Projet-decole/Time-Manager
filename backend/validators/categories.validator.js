// backend/validators/categories.validator.js

const { z } = require('zod');
const { validate } = require('../utils/validation');

/**
 * Hex color validation regex
 * Format: #RRGGBB (6 hex digits after #)
 * Story 3.5: Categories CRUD API - AC8
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Create category request validation schema
 * Story 3.5: Categories CRUD API - AC1
 * - name: required, non-empty string (1-50 chars)
 * - description: optional, max 200 chars
 * - color: required, hex format (#RRGGBB)
 */
const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .min(1, 'Category name cannot be empty')
    .max(50, 'Category name cannot exceed 50 characters'),
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .nullable(),
  color: z
    .string({ required_error: 'Color is required' })
    .regex(HEX_COLOR_REGEX, 'Color must be in hex format (#RRGGBB)')
});

/**
 * Update category request validation schema
 * Story 3.5: Categories CRUD API - AC4
 * - name: optional, non-empty string (1-50 chars)
 * - description: optional, max 200 chars (can be null to clear)
 * - color: optional, hex format (#RRGGBB)
 * At least one field must be provided
 */
const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name cannot be empty')
    .max(50, 'Category name cannot exceed 50 characters')
    .optional(),
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Color must be in hex format (#RRGGBB)')
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  validate,
  HEX_COLOR_REGEX
};
