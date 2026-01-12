// backend/validators/templates.validator.js

const { z } = require('zod');
const { validate, validateUUID } = require('../utils/validation');

/**
 * UUID v4 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Time format validation regex (HH:MM, 24-hour format)
 * Valid: 00:00 to 23:59
 * Story 4.8: Templates CRUD API - AC7
 */
const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid HH:MM format
 */
const isValidTimeFormat = (time) => TIME_FORMAT_REGEX.test(time);

/**
 * Compare two time strings and check if end > start
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} True if endTime > startTime
 */
const isEndTimeAfterStart = (startTime, endTime) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
};

/**
 * Template entry schema for validation
 * - startTime: required, HH:MM format
 * - endTime: required, HH:MM format, must be after startTime
 * - projectId: optional, valid UUID
 * - categoryId: optional, valid UUID
 * - description: optional, max 500 chars
 */
const templateEntrySchema = z.object({
  startTime: z
    .string({ required_error: 'Start time is required' })
    .refine(isValidTimeFormat, {
      message: 'Start time must be in HH:MM format (e.g., "09:00")'
    }),
  endTime: z
    .string({ required_error: 'End time is required' })
    .refine(isValidTimeFormat, {
      message: 'End time must be in HH:MM format (e.g., "17:00")'
    }),
  projectId: z
    .string()
    .regex(UUID_REGEX, 'Project ID must be a valid UUID')
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .regex(UUID_REGEX, 'Category ID must be a valid UUID')
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, 'Entry description cannot exceed 500 characters')
    .optional()
    .nullable()
}).refine(
  (data) => isEndTimeAfterStart(data.startTime, data.endTime),
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Create template request validation schema
 * Story 4.8: Templates CRUD API - AC1, AC7
 * - name: required, max 100 chars
 * - description: optional, max 500 chars
 * - entries: required, array with at least 1 entry
 */
const createTemplateSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  entries: z
    .array(templateEntrySchema, { required_error: 'Entries array is required' })
    .min(1, 'At least one entry is required')
});

/**
 * Update template request validation schema
 * Story 4.8: Templates CRUD API - AC4, AC7
 * - name: optional, max 100 chars
 * - description: optional, max 500 chars (can be null to clear)
 * - entries: optional, if provided replaces all existing entries
 */
const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  entries: z
    .array(templateEntrySchema)
    .min(1, 'Entries array must have at least one entry if provided')
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Create template from day request validation schema
 * Story 4.8: Templates CRUD API - AC6
 * - name: required, max 100 chars
 * - description: optional, max 500 chars
 */
const createFromDaySchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
});

/**
 * Date format validation regex (YYYY-MM-DD)
 * Story 4.9: Template Application API - AC8
 */
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Apply template request validation schema
 * Story 4.9: Template Application API - AC8
 * - date: required, YYYY-MM-DD format, within 1 year range
 */
const applyTemplateSchema = z.object({
  date: z
    .string({ required_error: 'Date is required' })
    .regex(DATE_FORMAT_REGEX, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, 'Invalid date')
    .refine((date) => {
      const d = new Date(date);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return d >= oneYearAgo;
    }, 'Date cannot be more than 1 year in the past')
    .refine((date) => {
      const d = new Date(date);
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      return d <= oneYearFromNow;
    }, 'Date cannot be more than 1 year in the future')
});

module.exports = {
  createTemplateSchema,
  updateTemplateSchema,
  createFromDaySchema,
  applyTemplateSchema,
  templateEntrySchema,
  validate,
  validateUUID,
  // Export helper functions for testing
  isValidTimeFormat,
  isEndTimeAfterStart,
  TIME_FORMAT_REGEX,
  DATE_FORMAT_REGEX
};
