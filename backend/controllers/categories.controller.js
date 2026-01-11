// backend/controllers/categories.controller.js

const categoriesService = require('../services/categories.service');
const { successResponse, paginatedResponse } = require('../utils/response');

/**
 * Get all categories with pagination
 * @route GET /api/v1/categories
 * @param {Request} req - Express request with query params { page?, limit?, includeInactive? }
 * @param {Response} res - Express response
 * Story 3.5: Categories CRUD API - AC2
 */
const getAll = async (req, res) => {
  const { page, limit, includeInactive } = req.query;

  // Only managers can see inactive categories
  const canSeeInactive = req.user && req.user.role === 'manager';
  const shouldIncludeInactive = canSeeInactive && includeInactive === 'true';

  const result = await categoriesService.getAll({
    page,
    limit,
    includeInactive: shouldIncludeInactive
  });

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Get category by ID
 * @route GET /api/v1/categories/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 3.5: Categories CRUD API - AC3
 */
const getById = async (req, res) => {
  const { id } = req.params;

  const category = await categoriesService.getById(id);

  return successResponse(res, category);
};

/**
 * Create a new category
 * @route POST /api/v1/categories
 * @param {Request} req - Express request with validatedBody { name, description?, color }
 * @param {Response} res - Express response
 * Story 3.5: Categories CRUD API - AC1
 */
const create = async (req, res) => {
  const categoryData = req.validatedBody;

  const createdCategory = await categoriesService.create(categoryData);

  return res.status(201).json({
    success: true,
    data: createdCategory
  });
};

/**
 * Update an existing category
 * @route PATCH /api/v1/categories/:id
 * @param {Request} req - Express request with params.id and validatedBody { name?, description?, color? }
 * @param {Response} res - Express response
 * Story 3.5: Categories CRUD API - AC4
 */
const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedBody;

  const updatedCategory = await categoriesService.update(id, updateData);

  return successResponse(res, updatedCategory);
};

/**
 * Deactivate a category (soft delete)
 * @route DELETE /api/v1/categories/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 3.5: Categories CRUD API - AC5
 */
const deactivate = async (req, res) => {
  const { id } = req.params;

  const result = await categoriesService.deactivate(id);

  return successResponse(res, result);
};

/**
 * Activate a category
 * @route POST /api/v1/categories/:id/activate
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 3.5: Categories CRUD API - AC6
 */
const activate = async (req, res) => {
  const { id } = req.params;

  const activatedCategory = await categoriesService.activate(id);

  return successResponse(res, activatedCategory);
};

module.exports = { getAll, getById, create, update, deactivate, activate };
