// backend/validators/time-entries.validator.js

const { z } = require('zod');
const { validate } = require('../utils/validation');

/**
 * UUID v4 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valid entry modes for time entries
 * Story 4.1: Time Entries CRUD API - AC1
 */
const ENTRY_MODES = ['simple', 'day', 'template'];

/**
 * Create time entry request validation schema
 * Story 4.1: Time Entries CRUD API - AC1, AC7
 * - startTime: required, ISO 8601 timestamp
 * - endTime: optional, ISO 8601 timestamp (must be after startTime)
 * - projectId: optional, valid UUID
 * - categoryId: optional, valid UUID
 * - description: optional, max 500 chars
 * - entryMode: required, one of 'simple', 'day', 'template'
 */
const createTimeEntrySchema = z.object({
  startTime: z
    .string({ required_error: 'Start time is required' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Start time must be a valid ISO 8601 timestamp' }
    ),
  endTime: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'End time must be a valid ISO 8601 timestamp' }
    )
    .optional()
    .nullable(),
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
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  entryMode: z
    .enum(ENTRY_MODES, {
      required_error: 'Entry mode is required',
      invalid_type_error: `Entry mode must be one of: ${ENTRY_MODES.join(', ')}`
    })
}).refine(
  (data) => {
    if (data.endTime && data.startTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Start timer request validation schema
 * Story 4.2: Simple Mode Start Timer API - AC1, AC5
 * - projectId: optional, valid UUID
 * - categoryId: optional, valid UUID
 * - description: optional, max 500 chars
 */
const startTimerSchema = z.object({
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
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
});

/**
 * Stop timer request validation schema
 * Story 4.3: Simple Mode Stop Timer API - AC3, AC4
 * Same validation as startTimerSchema (allows updating project/category/description at stop time)
 * - projectId: optional, valid UUID
 * - categoryId: optional, valid UUID
 * - description: optional, max 500 chars
 */
const stopTimerSchema = z.object({
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
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
});

/**
 * Update time entry request validation schema
 * Story 4.1: Time Entries CRUD API - AC4, AC7
 * - startTime: optional, ISO 8601 timestamp
 * - endTime: optional, ISO 8601 timestamp (can be null to clear)
 * - projectId: optional, UUID (can be null to clear)
 * - categoryId: optional, UUID (can be null to clear)
 * - description: optional, string (can be null to clear)
 * At least one field must be provided
 */
const updateTimeEntrySchema = z.object({
  startTime: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Start time must be a valid ISO 8601 timestamp' }
    )
    .optional(),
  endTime: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'End time must be a valid ISO 8601 timestamp' }
    )
    .optional()
    .nullable(),
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
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
).refine(
  (data) => {
    // Only validate if both startTime and endTime are being updated
    if (data.endTime && data.startTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Start day request validation schema
 * Story 4.5: Day Mode Day Start/End API - AC8
 * - description: optional, max 500 chars
 */
const startDaySchema = z.object({
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
});

/**
 * Create block request validation schema
 * Story 4.6: Day Mode Time Block Management API - AC1
 * - startTime: required, ISO 8601 timestamp
 * - endTime: required, ISO 8601 timestamp (must be after startTime)
 * - projectId: optional, valid UUID
 * - categoryId: optional, valid UUID
 * - description: optional, max 500 chars
 */
const createBlockSchema = z.object({
  startTime: z
    .string({ required_error: 'Start time is required' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Start time must be a valid ISO 8601 timestamp' }
    ),
  endTime: z
    .string({ required_error: 'End time is required' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'End time must be a valid ISO 8601 timestamp' }
    ),
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
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Update block request validation schema
 * Story 4.6: Day Mode Time Block Management API - AC4
 * - startTime: optional, ISO 8601 timestamp
 * - endTime: optional, ISO 8601 timestamp
 * - projectId: optional, UUID (can be null to clear)
 * - categoryId: optional, UUID (can be null to clear)
 * - description: optional, string (can be null to clear)
 * At least one field must be provided
 */
const updateBlockSchema = z.object({
  startTime: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Start time must be a valid ISO 8601 timestamp' }
    )
    .optional(),
  endTime: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'End time must be a valid ISO 8601 timestamp' }
    )
    .optional(),
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
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
).refine(
  (data) => {
    // Only validate if both startTime and endTime are being updated
    if (data.endTime && data.startTime) {
      return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

module.exports = {
  createTimeEntrySchema,
  updateTimeEntrySchema,
  startTimerSchema,
  stopTimerSchema,
  startDaySchema,
  createBlockSchema,
  updateBlockSchema,
  validate,
  ENTRY_MODES
};
