// backend/controllers/teams.controller.js

const teamsService = require('../services/teams.service');
const { successResponse, paginatedResponse } = require('../utils/response');

/**
 * Get all teams with pagination and member counts
 * @route GET /api/v1/teams
 * @param {Request} req - Express request with query params { page?, limit? }
 * @param {Response} res - Express response
 */
const getAll = async (req, res) => {
  const { page, limit } = req.query;

  const result = await teamsService.getAll({ page, limit });

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Get team by ID with members and projects
 * @route GET /api/v1/teams/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 */
const getById = async (req, res) => {
  const { id } = req.params;

  const team = await teamsService.getById(id);

  return successResponse(res, team);
};

/**
 * Create a new team
 * @route POST /api/v1/teams
 * @param {Request} req - Express request with validatedBody { name, description? }
 * @param {Response} res - Express response
 */
const create = async (req, res) => {
  const teamData = req.validatedBody;

  const createdTeam = await teamsService.create(teamData);

  return res.status(201).json({
    success: true,
    data: createdTeam
  });
};

/**
 * Update an existing team
 * @route PATCH /api/v1/teams/:id
 * @param {Request} req - Express request with params.id and validatedBody { name?, description? }
 * @param {Response} res - Express response
 */
const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedBody;

  const updatedTeam = await teamsService.update(id, updateData);

  return successResponse(res, updatedTeam);
};

/**
 * Delete a team
 * @route DELETE /api/v1/teams/:id
 * @param {Request} req - Express request with params.id
 * @param {Response} res - Express response
 */
const remove = async (req, res) => {
  const { id } = req.params;

  const result = await teamsService.remove(id);

  return successResponse(res, result);
};

/**
 * Get team members with pagination
 * @route GET /api/v1/teams/:teamId/members
 * @param {Request} req - Express request with params.teamId and query { page?, limit? }
 * @param {Response} res - Express response
 * Story 3.2: Team Member Assignment API - AC4
 */
const getMembers = async (req, res) => {
  const { teamId } = req.params;
  const { page, limit } = req.query;

  const result = await teamsService.getMembers(teamId, { page, limit });

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Add a member to a team
 * @route POST /api/v1/teams/:teamId/members
 * @param {Request} req - Express request with params.teamId and validatedBody { userId }
 * @param {Response} res - Express response
 * Story 3.2: Team Member Assignment API - AC1
 */
const addMember = async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.validatedBody;

  const membership = await teamsService.addMember(teamId, userId);

  return res.status(201).json({
    success: true,
    data: membership
  });
};

/**
 * Remove a member from a team
 * @route DELETE /api/v1/teams/:teamId/members/:userId
 * @param {Request} req - Express request with params.teamId and params.userId
 * @param {Response} res - Express response
 * Story 3.2: Team Member Assignment API - AC3
 */
const removeMember = async (req, res) => {
  const { teamId, userId } = req.params;

  const result = await teamsService.removeMember(teamId, userId);

  return successResponse(res, result);
};

// ===========================================
// Story 3.4: Team-Project Assignment API
// ===========================================

/**
 * Get team projects with pagination
 * @route GET /api/v1/teams/:teamId/projects
 * @param {Request} req - Express request with params.teamId and query { page?, limit? }
 * @param {Response} res - Express response
 * Story 3.4: Team-Project Assignment API - AC4
 */
const getProjects = async (req, res) => {
  const { teamId } = req.params;
  const { page, limit } = req.query;

  const result = await teamsService.getProjects(teamId, { page, limit });

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Assign a project to a team
 * @route POST /api/v1/teams/:teamId/projects
 * @param {Request} req - Express request with params.teamId and validatedBody { projectId }
 * @param {Response} res - Express response
 * Story 3.4: Team-Project Assignment API - AC1
 */
const assignProject = async (req, res) => {
  const { teamId } = req.params;
  const { projectId } = req.validatedBody;

  const assignment = await teamsService.assignProject(teamId, projectId);

  return res.status(201).json({
    success: true,
    data: assignment
  });
};

/**
 * Unassign a project from a team
 * @route DELETE /api/v1/teams/:teamId/projects/:projectId
 * @param {Request} req - Express request with params.teamId and params.projectId
 * @param {Response} res - Express response
 * Story 3.4: Team-Project Assignment API - AC3
 */
const unassignProject = async (req, res) => {
  const { teamId, projectId } = req.params;

  const result = await teamsService.unassignProject(teamId, projectId);

  return successResponse(res, result);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getMembers,
  addMember,
  removeMember,
  getProjects,
  assignProject,
  unassignProject
};
