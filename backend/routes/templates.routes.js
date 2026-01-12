// backend/routes/templates.routes.js

const express = require('express');
const templatesController = require('../controllers/templates.controller');
const asyncHandler = require('../utils/asyncHandler');
const { createTemplateSchema, updateTemplateSchema, createFromDaySchema, applyTemplateSchema, validate, validateUUID } = require('../validators/templates.validator');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/templates
 * @desc    Get all templates for the authenticated user with pagination
 * @access  Private (requires authentication)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * Story 4.8: Templates CRUD API - AC2
 */
router.get('/', authenticate, asyncHandler(templatesController.getAll));

/**
 * @route   POST /api/v1/templates
 * @desc    Create a new template with entries
 * @access  Private (requires authentication)
 * @body    { name, description?, entries: [{ startTime, endTime, projectId?, categoryId?, description? }] }
 * Story 4.8: Templates CRUD API - AC1
 */
router.post('/', authenticate, validate(createTemplateSchema), asyncHandler(templatesController.create));

/**
 * @route   POST /api/v1/templates/from-day/:dayId
 * @desc    Create a template from an existing day entry's blocks
 * @access  Private (requires authentication)
 * @param   dayId - UUID of the day entry to create template from
 * @body    { name, description? }
 * Story 4.8: Templates CRUD API - AC6
 */
router.post('/from-day/:dayId', authenticate, validateUUID('dayId'), validate(createFromDaySchema), asyncHandler(templatesController.createFromDay));

/**
 * @route   GET /api/v1/templates/:id
 * @desc    Get a template by ID with all its entries
 * @access  Private (requires authentication, owner only)
 * Story 4.8: Templates CRUD API - AC3
 */
router.get('/:id', authenticate, validateUUID('id'), asyncHandler(templatesController.getById));

/**
 * @route   PATCH /api/v1/templates/:id
 * @desc    Update a template (name, description) and/or replace its entries
 * @access  Private (requires authentication, owner only)
 * @body    { name?, description?, entries?: [...] }
 * Story 4.8: Templates CRUD API - AC4
 */
router.patch('/:id', authenticate, validateUUID('id'), validate(updateTemplateSchema), asyncHandler(templatesController.update));

/**
 * @route   DELETE /api/v1/templates/:id
 * @desc    Delete a template and all its entries (cascade)
 * @access  Private (requires authentication, owner only)
 * Story 4.8: Templates CRUD API - AC5
 */
router.delete('/:id', authenticate, validateUUID('id'), asyncHandler(templatesController.remove));

/**
 * @route   POST /api/v1/templates/:id/apply
 * @desc    Apply a template to create a pre-filled day with time blocks
 * @access  Private (requires authentication, owner only)
 * @param   id - UUID of the template to apply
 * @body    { date: "YYYY-MM-DD" } - Target date to create the day for
 * Story 4.9: Template Application API - AC1-AC9 (merged into Story 4.8)
 */
router.post('/:id/apply', authenticate, validateUUID('id'), validate(applyTemplateSchema), asyncHandler(templatesController.apply));

module.exports = router;
