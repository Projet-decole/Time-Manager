// backend/routes/projects.routes.js

const express = require('express');
const projectsController = require('../controllers/projects.controller');
const asyncHandler = require('../utils/asyncHandler');
const { createProjectSchema, updateProjectSchema, validate, validateUUID } = require('../validators/projects.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/projects
 * @desc    Get all projects with pagination and total hours tracked
 * @access  Private (requires authentication, any role)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   includeArchived - Include archived projects (manager only)
 * Story 3.3: Projects CRUD API - AC2
 */
router.get('/', authenticate, asyncHandler(projectsController.getAll));

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project with auto-generated code
 * @access  Private (requires authentication + manager role)
 * @body    { name: string, description?: string, budgetHours?: number }
 * Story 3.3: Projects CRUD API - AC1
 */
router.post('/', authenticate, rbac('manager'), validate(createProjectSchema), asyncHandler(projectsController.create));

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get project details with teams and hours tracked
 * @access  Private (requires authentication, any role)
 * Story 3.3: Projects CRUD API - AC3
 */
router.get('/:id', authenticate, validateUUID('id'), asyncHandler(projectsController.getById));

/**
 * @route   PATCH /api/v1/projects/:id
 * @desc    Update project name, description, or budgetHours (code is immutable)
 * @access  Private (requires authentication + manager role)
 * @body    { name?: string, description?: string, budgetHours?: number }
 * Story 3.3: Projects CRUD API - AC4
 */
router.patch('/:id', authenticate, rbac('manager'), validateUUID('id'), validate(updateProjectSchema), asyncHandler(projectsController.update));

/**
 * @route   POST /api/v1/projects/:id/archive
 * @desc    Archive a project (soft delete)
 * @access  Private (requires authentication + manager role)
 * Story 3.3: Projects CRUD API - AC5
 */
router.post('/:id/archive', authenticate, rbac('manager'), validateUUID('id'), asyncHandler(projectsController.archive));

/**
 * @route   POST /api/v1/projects/:id/restore
 * @desc    Restore an archived project
 * @access  Private (requires authentication + manager role)
 * Story 3.3: Projects CRUD API - AC6
 */
router.post('/:id/restore', authenticate, rbac('manager'), validateUUID('id'), asyncHandler(projectsController.restore));

module.exports = router;
