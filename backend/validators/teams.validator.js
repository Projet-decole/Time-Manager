// backend/validators/teams.validator.js

const { z } = require('zod');
const { validate } = require('../utils/validation');

/**
 * Create team request validation schema
 * Story 3.1: Teams CRUD API
 * - name: required, non-empty string (1-100 chars)
 * - description: optional, max 500 chars
 */
const createTeamSchema = z.object({
  name: z
    .string({ required_error: 'Team name is required' })
    .trim()
    .min(1, 'Team name cannot be empty')
    .max(100, 'Team name cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
});

/**
 * Update team request validation schema
 * Story 3.1: Teams CRUD API
 * - name: optional, non-empty string (1-100 chars)
 * - description: optional, max 500 chars (can be null to clear)
 * At least one valid field (name or description) must be provided
 */
const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Team name cannot be empty')
    .max(100, 'Team name cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable()
}).strict().refine(
  (data) => data.name !== undefined || data.description !== undefined,
  { message: 'At least one valid field (name or description) must be provided for update' }
);

/**
 * Add member to team request validation schema
 * Story 3.2: Team Member Assignment API
 * - userId: required, UUID format
 */
const addMemberSchema = z.object({
  userId: z
    .string({ required_error: 'User ID is required' })
    .uuid('User ID must be a valid UUID')
});

/**
 * Assign project to team request validation schema
 * Story 3.4: Team-Project Assignment API
 * - projectId: required, UUID format
 */
const assignProjectSchema = z.object({
  projectId: z
    .string({ required_error: 'Project ID is required' })
    .uuid('Project ID must be a valid UUID')
});

const { validateUUID } = require('../utils/validation');

module.exports = {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
  assignProjectSchema,
  validate,
  validateUUID
};
