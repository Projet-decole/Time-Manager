// backend/controllers/time-entries.controller.js

const timeEntriesService = require('../services/time-entries.service');
const { successResponse, paginatedResponse } = require('../utils/response');

/**
 * Get all time entries with pagination and filters
 * @route GET /api/v1/time-entries
 * @param {Request} req - Express request with query params { page?, limit?, startDate?, endDate?, userId? }
 * @param {Response} res - Express response
 * Story 4.1: Time Entries CRUD API - AC2, AC6
 */
const getAll = async (req, res) => {
  const { page, limit, startDate, endDate, userId: targetUserId } = req.query;
  const requestingUserId = req.user.id;
  const userRole = req.user.role;

  const result = await timeEntriesService.getAll(requestingUserId, {
    page,
    limit,
    startDate,
    endDate,
    targetUserId,
    role: userRole
  });

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Get time entry by ID
 * @route GET /api/v1/time-entries/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 4.1: Time Entries CRUD API - AC3
 */
const getById = async (req, res) => {
  const { id } = req.params;
  const requestingUserId = req.user.id;
  const userRole = req.user.role;

  const timeEntry = await timeEntriesService.getById(id, requestingUserId, userRole);

  return successResponse(res, timeEntry);
};

/**
 * Create a new time entry
 * @route POST /api/v1/time-entries
 * @param {Request} req - Express request with validatedBody
 * @param {Response} res - Express response
 * Story 4.1: Time Entries CRUD API - AC1
 */
const create = async (req, res) => {
  const timeEntryData = req.validatedBody;
  const userId = req.user.id;

  const createdEntry = await timeEntriesService.create(userId, timeEntryData);

  return res.status(201).json({
    success: true,
    data: createdEntry
  });
};

/**
 * Update an existing time entry
 * @route PATCH /api/v1/time-entries/:id
 * @param {Request} req - Express request with params.id and validatedBody
 * @param {Response} res - Express response
 * Story 4.1: Time Entries CRUD API - AC4
 */
const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedBody;
  const userId = req.user.id;
  const userRole = req.user.role;

  const updatedEntry = await timeEntriesService.update(id, userId, updateData, userRole);

  return successResponse(res, updatedEntry);
};

/**
 * Delete a time entry
 * @route DELETE /api/v1/time-entries/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 4.1: Time Entries CRUD API - AC5
 */
const remove = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const result = await timeEntriesService.remove(id, userId, userRole);

  return successResponse(res, result);
};

/**
 * Start a new timer (Simple Mode)
 * @route POST /api/v1/time-entries/start
 * @param {Request} req - Express request with optional body { projectId?, categoryId?, description? }
 * @param {Response} res - Express response
 * Story 4.2: Simple Mode Start Timer API - AC1, AC2, AC4
 */
const startTimer = async (req, res) => {
  const timerData = req.validatedBody || {};
  const userId = req.user.id;

  const createdEntry = await timeEntriesService.startTimer(userId, timerData);

  return res.status(201).json({
    success: true,
    data: createdEntry
  });
};

/**
 * Get active timer for current user (Simple Mode)
 * @route GET /api/v1/time-entries/active
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * Story 4.2: Simple Mode Start Timer API - AC3
 */
const getActive = async (req, res) => {
  const userId = req.user.id;

  const activeTimer = await timeEntriesService.getActiveTimer(userId);

  return successResponse(res, activeTimer);
};

/**
 * Stop the active timer for current user (Simple Mode)
 * @route POST /api/v1/time-entries/stop
 * @param {Request} req - Express request with optional body { projectId?, categoryId?, description? }
 * @param {Response} res - Express response
 * Story 4.3: Simple Mode Stop Timer API - AC1, AC2, AC3
 */
const stopTimer = async (req, res) => {
  const stopData = req.validatedBody || {};
  const userId = req.user.id;

  const completedEntry = await timeEntriesService.stopTimer(userId, stopData);

  return successResponse(res, completedEntry);
};

/**
 * Start a new workday (Day Mode)
 * @route POST /api/v1/time-entries/day/start
 * @param {Request} req - Express request with optional body { description? }
 * @param {Response} res - Express response
 * Story 4.5: Day Mode Day Start/End API - AC1, AC2, AC8
 */
const startDay = async (req, res) => {
  const dayData = req.validatedBody || {};
  const userId = req.user.id;

  const createdEntry = await timeEntriesService.startDay(userId, dayData);

  return res.status(201).json({
    success: true,
    data: createdEntry
  });
};

/**
 * End the active workday for current user (Day Mode)
 * @route POST /api/v1/time-entries/day/end
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * Story 4.5: Day Mode Day Start/End API - AC3, AC4
 */
const endDay = async (req, res) => {
  const userId = req.user.id;

  const completedEntry = await timeEntriesService.endDay(userId);

  return successResponse(res, completedEntry);
};

/**
 * Get active day for current user (Day Mode)
 * @route GET /api/v1/time-entries/day/active
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * Story 4.5: Day Mode Day Start/End API - AC5, AC6
 */
const getActiveDay = async (req, res) => {
  const userId = req.user.id;

  const activeDay = await timeEntriesService.getActiveDay(userId);

  // If active day exists, get it with blocks
  if (activeDay) {
    const dayWithBlocks = await timeEntriesService.getDayWithBlocks(activeDay.id, userId);
    return successResponse(res, dayWithBlocks);
  }

  // Return null if no active day
  return successResponse(res, null);
};

/**
 * Create a new time block within the active day (Day Mode)
 * @route POST /api/v1/time-entries/day/blocks
 * @param {Request} req - Express request with validatedBody { startTime, endTime, projectId?, categoryId?, description? }
 * @param {Response} res - Express response
 * Story 4.6: Day Mode Time Block Management API - AC1
 */
const createBlock = async (req, res) => {
  const blockData = req.validatedBody;
  const userId = req.user.id;

  const createdBlock = await timeEntriesService.createBlock(userId, blockData);

  return res.status(201).json({
    success: true,
    data: createdBlock
  });
};

/**
 * List all blocks for the active day (Day Mode)
 * @route GET /api/v1/time-entries/day/blocks
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * Story 4.6: Day Mode Time Block Management API - AC10
 */
const listBlocks = async (req, res) => {
  const userId = req.user.id;

  const result = await timeEntriesService.listBlocks(userId);

  return res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta
  });
};

/**
 * Update a time block (Day Mode)
 * @route PATCH /api/v1/time-entries/day/blocks/:blockId
 * @param {Request} req - Express request with params.blockId and validatedBody
 * @param {Response} res - Express response
 * Story 4.6: Day Mode Time Block Management API - AC4, AC5
 */
const updateBlock = async (req, res) => {
  const { blockId } = req.params;
  const updateData = req.validatedBody;
  const userId = req.user.id;

  const updatedBlock = await timeEntriesService.updateBlock(blockId, userId, updateData);

  return successResponse(res, updatedBlock);
};

/**
 * Delete a time block (Day Mode)
 * @route DELETE /api/v1/time-entries/day/blocks/:blockId
 * @param {Request} req - Express request with params.blockId
 * @param {Response} res - Express response
 * Story 4.6: Day Mode Time Block Management API - AC6
 */
const deleteBlock = async (req, res) => {
  const { blockId } = req.params;
  const userId = req.user.id;

  const result = await timeEntriesService.deleteBlock(blockId, userId);

  return successResponse(res, result);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  startTimer,
  getActive,
  stopTimer,
  startDay,
  endDay,
  getActiveDay,
  // Day Mode Block methods (Story 4.6)
  createBlock,
  listBlocks,
  updateBlock,
  deleteBlock
};
