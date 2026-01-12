// backend/controllers/templates.controller.js

const templatesService = require('../services/templates.service');
const { successResponse, paginatedResponse } = require('../utils/response');

/**
 * Get all templates for the authenticated user with pagination
 * @route GET /api/v1/templates
 * @param {Request} req - Express request with query params { page?, limit? }
 * @param {Response} res - Express response
 * Story 4.8: Templates CRUD API - AC2
 */
const getAll = async (req, res) => {
  const { page, limit } = req.query;
  const userId = req.user.id;

  const result = await templatesService.getAll(userId, { page, limit });

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Get a template by ID
 * @route GET /api/v1/templates/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 4.8: Templates CRUD API - AC3
 */
const getById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const template = await templatesService.getById(id, userId);

  return successResponse(res, template);
};

/**
 * Create a new template with entries
 * @route POST /api/v1/templates
 * @param {Request} req - Express request with validatedBody
 * @param {Response} res - Express response
 * Story 4.8: Templates CRUD API - AC1
 */
const create = async (req, res) => {
  const templateData = req.validatedBody;
  const userId = req.user.id;

  const createdTemplate = await templatesService.create(userId, templateData);

  return res.status(201).json({
    success: true,
    data: createdTemplate
  });
};

/**
 * Update an existing template
 * @route PATCH /api/v1/templates/:id
 * @param {Request} req - Express request with params.id and validatedBody
 * @param {Response} res - Express response
 * Story 4.8: Templates CRUD API - AC4
 */
const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedBody;
  const userId = req.user.id;

  const updatedTemplate = await templatesService.update(id, userId, updateData);

  return successResponse(res, updatedTemplate);
};

/**
 * Delete a template
 * @route DELETE /api/v1/templates/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 4.8: Templates CRUD API - AC5
 */
const remove = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await templatesService.remove(id, userId);

  return successResponse(res, result);
};

/**
 * Create a template from an existing day entry
 * @route POST /api/v1/templates/from-day/:dayId
 * @param {Request} req - Express request with params.dayId and validatedBody
 * @param {Response} res - Express response
 * Story 4.8: Templates CRUD API - AC6
 */
const createFromDay = async (req, res) => {
  const { dayId } = req.params;
  const templateData = req.validatedBody;
  const userId = req.user.id;

  const createdTemplate = await templatesService.createFromDay(userId, dayId, templateData);

  return res.status(201).json({
    success: true,
    data: createdTemplate
  });
};

/**
 * Apply a template to create a pre-filled day
 * @route POST /api/v1/templates/:id/apply
 * @param {Request} req - Express request with params.id and validatedBody
 * @param {Response} res - Express response
 * Story 4.9: Template Application API - AC1-AC9
 */
const apply = async (req, res) => {
  const { id } = req.params;
  const { date } = req.validatedBody;
  const userId = req.user.id;

  const result = await templatesService.applyTemplate(id, userId, date);

  const response = {
    success: true,
    data: result.data,
    meta: {
      templateId: result.templateId,
      templateName: result.templateName,
      entriesApplied: result.entriesApplied
    }
  };

  // Add warnings to meta if present
  if (result.warnings && result.warnings.length > 0) {
    response.meta.warnings = result.warnings;
  }

  return res.status(201).json(response);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  createFromDay,
  apply
};
