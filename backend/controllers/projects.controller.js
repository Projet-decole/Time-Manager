// backend/controllers/projects.controller.js

const projectsService = require('../services/projects.service');
const { successResponse, paginatedResponse } = require('../utils/response');

/**
 * Get all projects with pagination and filtering
 * @route GET /api/v1/projects
 * @param {Request} req - Express request with query params { page?, limit?, includeArchived?, myTeams? }
 * @param {Response} res - Express response
 * Story 3.3: Projects CRUD API - AC2
 * Story 3.4: Team-Project Assignment API - AC5
 */
const getAll = async (req, res) => {
  const { page, limit, includeArchived, myTeams } = req.query;

  // If myTeams=true, filter to only projects from user's teams
  if (myTeams === 'true') {
    const result = await projectsService.getProjectsForUserTeams(req.user.id, { page, limit });
    return paginatedResponse(res, result.data, result.pagination);
  }

  // Only managers can see archived projects
  const isManager = req.user?.role === 'manager';
  const shouldIncludeArchived = isManager && includeArchived === 'true';

  const result = await projectsService.getAll({
    page,
    limit,
    includeArchived: shouldIncludeArchived
  });

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Get project by ID with teams and hours tracked
 * @route GET /api/v1/projects/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 3.3: Projects CRUD API - AC3
 */
const getById = async (req, res) => {
  const { id } = req.params;

  const project = await projectsService.getById(id);

  return successResponse(res, project);
};

/**
 * Create a new project
 * @route POST /api/v1/projects
 * @param {Request} req - Express request with validatedBody { name, description?, budgetHours? }
 * @param {Response} res - Express response
 * Story 3.3: Projects CRUD API - AC1
 */
const create = async (req, res) => {
  const projectData = req.validatedBody;

  const createdProject = await projectsService.create(projectData);

  return res.status(201).json({
    success: true,
    data: createdProject
  });
};

/**
 * Update an existing project
 * @route PATCH /api/v1/projects/:id
 * @param {Request} req - Express request with params.id and validatedBody { name?, description?, budgetHours? }
 * @param {Response} res - Express response
 * Story 3.3: Projects CRUD API - AC4
 */
const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedBody;

  const updatedProject = await projectsService.update(id, updateData);

  return successResponse(res, updatedProject);
};

/**
 * Archive a project (soft delete)
 * @route POST /api/v1/projects/:id/archive
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 3.3: Projects CRUD API - AC5
 */
const archive = async (req, res) => {
  const { id } = req.params;

  const archivedProject = await projectsService.archive(id);

  return successResponse(res, archivedProject);
};

/**
 * Restore an archived project
 * @route POST /api/v1/projects/:id/restore
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 * Story 3.3: Projects CRUD API - AC6
 */
const restore = async (req, res) => {
  const { id } = req.params;

  const restoredProject = await projectsService.restore(id);

  return successResponse(res, restoredProject);
};

module.exports = { getAll, getById, create, update, archive, restore };
