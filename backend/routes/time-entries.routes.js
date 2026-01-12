// backend/routes/time-entries.routes.js

const express = require('express');
const timeEntriesController = require('../controllers/time-entries.controller');
const asyncHandler = require('../utils/asyncHandler');
const { createTimeEntrySchema, updateTimeEntrySchema, startTimerSchema, stopTimerSchema, startDaySchema, createBlockSchema, updateBlockSchema, validate } = require('../validators/time-entries.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validateUUID } = require('../utils/validation');

const router = express.Router();

/**
 * @route   GET /api/v1/time-entries
 * @desc    Get all time entries with pagination and filters
 * @access  Private (requires authentication)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   startDate - Filter by start date (YYYY-MM-DD)
 * @query   endDate - Filter by end date (YYYY-MM-DD)
 * @query   userId - Filter by user ID (manager only)
 * Story 4.1: Time Entries CRUD API - AC2, AC6
 */
router.get('/', authenticate, asyncHandler(timeEntriesController.getAll));

/**
 * @route   POST /api/v1/time-entries
 * @desc    Create a new time entry
 * @access  Private (requires authentication)
 * @body    { startTime, endTime?, projectId?, categoryId?, description?, entryMode }
 * Story 4.1: Time Entries CRUD API - AC1
 */
router.post('/', authenticate, validate(createTimeEntrySchema), asyncHandler(timeEntriesController.create));

/**
 * @route   POST /api/v1/time-entries/start
 * @desc    Start a new timer (Simple Mode)
 * @access  Private (requires authentication)
 * @body    { projectId?, categoryId?, description? }
 * Story 4.2: Simple Mode Start Timer API - AC1, AC2, AC4
 */
router.post('/start', authenticate, validate(startTimerSchema), asyncHandler(timeEntriesController.startTimer));

/**
 * @route   POST /api/v1/time-entries/stop
 * @desc    Stop the running timer (Simple Mode)
 * @access  Private (requires authentication)
 * @body    { projectId?, categoryId?, description? } (optional, to update at stop time)
 * Story 4.3: Simple Mode Stop Timer API - AC1, AC2, AC3
 */
router.post('/stop', authenticate, validate(stopTimerSchema), asyncHandler(timeEntriesController.stopTimer));

/**
 * @route   GET /api/v1/time-entries/active
 * @desc    Get active timer for current user (Simple Mode)
 * @access  Private (requires authentication)
 * Story 4.2: Simple Mode Start Timer API - AC3
 */
router.get('/active', authenticate, asyncHandler(timeEntriesController.getActive));

// ===========================================
// Day Mode routes (Story 4.5)
// These routes MUST be before /:id to avoid route conflicts
// ===========================================

/**
 * @route   POST /api/v1/time-entries/day/start
 * @desc    Start a new workday (Day Mode)
 * @access  Private (requires authentication)
 * @body    { description? }
 * Story 4.5: Day Mode Day Start/End API - AC1, AC2, AC8
 */
router.post('/day/start', authenticate, validate(startDaySchema), asyncHandler(timeEntriesController.startDay));

/**
 * @route   POST /api/v1/time-entries/day/end
 * @desc    End the active workday (Day Mode)
 * @access  Private (requires authentication)
 * Story 4.5: Day Mode Day Start/End API - AC3, AC4
 */
router.post('/day/end', authenticate, asyncHandler(timeEntriesController.endDay));

/**
 * @route   GET /api/v1/time-entries/day/active
 * @desc    Get active day with its time blocks (Day Mode)
 * @access  Private (requires authentication)
 * Story 4.5: Day Mode Day Start/End API - AC5, AC6
 */
router.get('/day/active', authenticate, asyncHandler(timeEntriesController.getActiveDay));

// ===========================================
// Day Mode Time Block routes (Story 4.6)
// These routes manage time blocks within an active day
// ===========================================

/**
 * @route   POST /api/v1/time-entries/day/blocks
 * @desc    Create a new time block within the active day (Day Mode)
 * @access  Private (requires authentication)
 * @body    { startTime, endTime, projectId?, categoryId?, description? }
 * Story 4.6: Day Mode Time Block Management API - AC1, AC2, AC3
 */
router.post('/day/blocks', authenticate, validate(createBlockSchema), asyncHandler(timeEntriesController.createBlock));

/**
 * @route   GET /api/v1/time-entries/day/blocks
 * @desc    List all blocks for the active day (Day Mode)
 * @access  Private (requires authentication)
 * Story 4.6: Day Mode Time Block Management API - AC10
 */
router.get('/day/blocks', authenticate, asyncHandler(timeEntriesController.listBlocks));

/**
 * @route   PATCH /api/v1/time-entries/day/blocks/:blockId
 * @desc    Update a time block (Day Mode)
 * @access  Private (requires authentication, owner only)
 * @body    { startTime?, endTime?, projectId?, categoryId?, description? }
 * Story 4.6: Day Mode Time Block Management API - AC4, AC5
 */
router.patch('/day/blocks/:blockId', authenticate, validateUUID('blockId'), validate(updateBlockSchema), asyncHandler(timeEntriesController.updateBlock));

/**
 * @route   DELETE /api/v1/time-entries/day/blocks/:blockId
 * @desc    Delete a time block (Day Mode)
 * @access  Private (requires authentication, owner only)
 * Story 4.6: Day Mode Time Block Management API - AC6
 */
router.delete('/day/blocks/:blockId', authenticate, validateUUID('blockId'), asyncHandler(timeEntriesController.deleteBlock));

/**
 * @route   GET /api/v1/time-entries/:id
 * @desc    Get time entry details by ID
 * @access  Private (requires authentication, owner or manager)
 * Story 4.1: Time Entries CRUD API - AC3
 */
router.get('/:id', authenticate, validateUUID('id'), asyncHandler(timeEntriesController.getById));

/**
 * @route   PATCH /api/v1/time-entries/:id
 * @desc    Update time entry
 * @access  Private (requires authentication, owner only, timesheet must be draft)
 * @body    { startTime?, endTime?, projectId?, categoryId?, description? }
 * Story 4.1: Time Entries CRUD API - AC4
 */
router.patch('/:id', authenticate, validateUUID('id'), validate(updateTimeEntrySchema), asyncHandler(timeEntriesController.update));

/**
 * @route   DELETE /api/v1/time-entries/:id
 * @desc    Delete a time entry
 * @access  Private (requires authentication, owner only, timesheet must be draft)
 * Story 4.1: Time Entries CRUD API - AC5
 */
router.delete('/:id', authenticate, validateUUID('id'), asyncHandler(timeEntriesController.remove));

module.exports = router;
