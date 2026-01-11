// backend/routes/users.routes.js

const express = require('express');
const usersController = require('../controllers/users.controller');
const asyncHandler = require('../utils/asyncHandler');
const { updateProfileSchema, createUserSchema, updateUserSchema, validate } = require('../validators/users.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with pagination and optional role filtering
 * @access  Private (requires authentication + manager role)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   role - Filter by role (employee|manager)
 */
router.get('/', authenticate, rbac('manager'), asyncHandler(usersController.getAll));

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user's profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticate, asyncHandler(usersController.getMe));

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user's profile (firstName, lastName, weeklyHoursTarget only)
 * @access  Private (requires authentication)
 */
router.patch('/me', authenticate, validate(updateProfileSchema), asyncHandler(usersController.updateMe));

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user (manager only)
 * @access  Private (requires authentication + manager role)
 * @body    { email, firstName, lastName, role?, weeklyHoursTarget? }
 * Story 2.14: Manager User Management
 */
router.post('/', authenticate, rbac('manager'), validate(createUserSchema), asyncHandler(usersController.create));

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update a user (manager only)
 * @access  Private (requires authentication + manager role)
 * @body    { firstName?, lastName?, weeklyHoursTarget? }
 * Story 2.14: Manager User Management
 */
router.patch('/:id', authenticate, rbac('manager'), validate(updateUserSchema), asyncHandler(usersController.update));

module.exports = router;
