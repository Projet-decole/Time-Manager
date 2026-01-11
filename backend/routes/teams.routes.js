// backend/routes/teams.routes.js

const express = require('express');
const teamsController = require('../controllers/teams.controller');
const asyncHandler = require('../utils/asyncHandler');
const { createTeamSchema, updateTeamSchema, addMemberSchema, assignProjectSchema, validate } = require('../validators/teams.validator');
const { validateUUID } = require('../utils/validation');
const { authenticate } = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/teams
 * @desc    Get all teams with pagination and member counts
 * @access  Private (requires authentication + manager role)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * Story 3.1: Teams CRUD API - AC2
 */
router.get('/', authenticate, rbac('manager'), asyncHandler(teamsController.getAll));

/**
 * @route   POST /api/v1/teams
 * @desc    Create a new team
 * @access  Private (requires authentication + manager role)
 * @body    { name: string, description?: string }
 * Story 3.1: Teams CRUD API - AC1
 */
router.post('/', authenticate, rbac('manager'), validate(createTeamSchema), asyncHandler(teamsController.create));

/**
 * @route   GET /api/v1/teams/:id
 * @desc    Get team details with members and projects
 * @access  Private (requires authentication + manager role)
 * Story 3.1: Teams CRUD API - AC3
 */
router.get('/:id', authenticate, rbac('manager'), validateUUID('id'), asyncHandler(teamsController.getById));

/**
 * @route   PATCH /api/v1/teams/:id
 * @desc    Update team name and/or description
 * @access  Private (requires authentication + manager role)
 * @body    { name?: string, description?: string }
 * Story 3.1: Teams CRUD API - AC4
 */
router.patch('/:id', authenticate, rbac('manager'), validateUUID('id'), validate(updateTeamSchema), asyncHandler(teamsController.update));

/**
 * @route   DELETE /api/v1/teams/:id
 * @desc    Delete a team (cascade removes team_members, team_projects)
 * @access  Private (requires authentication + manager role)
 * Story 3.1: Teams CRUD API - AC5
 */
router.delete('/:id', authenticate, rbac('manager'), validateUUID('id'), asyncHandler(teamsController.remove));

// ===========================================
// Team Members Routes - Story 3.2
// ===========================================

/**
 * @route   GET /api/v1/teams/:teamId/members
 * @desc    Get all members of a team with pagination
 * @access  Private (requires authentication + manager role)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * Story 3.2: Team Member Assignment API - AC4
 */
router.get('/:teamId/members', authenticate, rbac('manager'), validateUUID('teamId'), asyncHandler(teamsController.getMembers));

/**
 * @route   POST /api/v1/teams/:teamId/members
 * @desc    Add a member to a team
 * @access  Private (requires authentication + manager role)
 * @body    { userId: string (UUID) }
 * Story 3.2: Team Member Assignment API - AC1
 */
router.post('/:teamId/members', authenticate, rbac('manager'), validateUUID('teamId'), validate(addMemberSchema), asyncHandler(teamsController.addMember));

/**
 * @route   DELETE /api/v1/teams/:teamId/members/:userId
 * @desc    Remove a member from a team
 * @access  Private (requires authentication + manager role)
 * Story 3.2: Team Member Assignment API - AC3
 */
router.delete('/:teamId/members/:userId', authenticate, rbac('manager'), validateUUID('teamId'), validateUUID('userId'), asyncHandler(teamsController.removeMember));

// ===========================================
// Team Projects Routes - Story 3.4
// ===========================================

/**
 * @route   GET /api/v1/teams/:teamId/projects
 * @desc    Get all projects assigned to a team with pagination
 * @access  Private (requires authentication + manager role)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * Story 3.4: Team-Project Assignment API - AC4
 */
router.get('/:teamId/projects', authenticate, rbac('manager'), validateUUID('teamId'), asyncHandler(teamsController.getProjects));

/**
 * @route   POST /api/v1/teams/:teamId/projects
 * @desc    Assign a project to a team
 * @access  Private (requires authentication + manager role)
 * @body    { projectId: string (UUID) }
 * Story 3.4: Team-Project Assignment API - AC1
 */
router.post('/:teamId/projects', authenticate, rbac('manager'), validateUUID('teamId'), validate(assignProjectSchema), asyncHandler(teamsController.assignProject));

/**
 * @route   DELETE /api/v1/teams/:teamId/projects/:projectId
 * @desc    Unassign a project from a team
 * @access  Private (requires authentication + manager role)
 * Story 3.4: Team-Project Assignment API - AC3
 */
router.delete('/:teamId/projects/:projectId', authenticate, rbac('manager'), validateUUID('teamId'), validateUUID('projectId'), asyncHandler(teamsController.unassignProject));

module.exports = router;
