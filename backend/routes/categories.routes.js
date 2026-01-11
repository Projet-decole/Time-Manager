// backend/routes/categories.routes.js

const express = require('express');
const categoriesController = require('../controllers/categories.controller');
const asyncHandler = require('../utils/asyncHandler');
const { createCategorySchema, updateCategorySchema, validate } = require('../validators/categories.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with pagination (active only by default)
 * @access  Private (requires authentication, any role)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   includeInactive - Include inactive categories (manager only)
 * Story 3.5: Categories CRUD API - AC2
 */
router.get('/', authenticate, asyncHandler(categoriesController.getAll));

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private (requires authentication + manager role)
 * @body    { name: string, description?: string, color: string (#RRGGBB) }
 * Story 3.5: Categories CRUD API - AC1
 */
router.post('/', authenticate, rbac('manager'), validate(createCategorySchema), asyncHandler(categoriesController.create));

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category details by ID
 * @access  Private (requires authentication, any role)
 * Story 3.5: Categories CRUD API - AC3
 */
router.get('/:id', authenticate, asyncHandler(categoriesController.getById));

/**
 * @route   PATCH /api/v1/categories/:id
 * @desc    Update category name, description, or color
 * @access  Private (requires authentication + manager role)
 * @body    { name?: string, description?: string, color?: string (#RRGGBB) }
 * Story 3.5: Categories CRUD API - AC4
 */
router.patch('/:id', authenticate, rbac('manager'), validate(updateCategorySchema), asyncHandler(categoriesController.update));

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Deactivate a category (soft delete)
 * @access  Private (requires authentication + manager role)
 * Story 3.5: Categories CRUD API - AC5
 */
router.delete('/:id', authenticate, rbac('manager'), asyncHandler(categoriesController.deactivate));

/**
 * @route   POST /api/v1/categories/:id/activate
 * @desc    Reactivate a deactivated category
 * @access  Private (requires authentication + manager role)
 * Story 3.5: Categories CRUD API - AC6
 */
router.post('/:id/activate', authenticate, rbac('manager'), asyncHandler(categoriesController.activate));

module.exports = router;
