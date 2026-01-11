// backend/controllers/users.controller.js

const usersService = require('../services/users.service');
const { successResponse, paginatedResponse } = require('../utils/response');

/**
 * Get current user's profile
 * @route GET /api/v1/users/me
 * @param {Request} req - Express request with req.user from auth middleware
 * @param {Response} res - Express response
 */
const getMe = async (req, res) => {
  const userId = req.user.id;

  const profile = await usersService.getProfile(userId);

  return successResponse(res, profile);
};

/**
 * Update current user's profile
 * @route PATCH /api/v1/users/me
 * @param {Request} req - Express request with validatedBody { firstName?, lastName?, weeklyHoursTarget? }
 * @param {Response} res - Express response
 */
const updateMe = async (req, res) => {
  const userId = req.user.id;
  const updateData = req.validatedBody;

  const updatedProfile = await usersService.updateProfile(userId, updateData);

  return successResponse(res, updatedProfile);
};

/**
 * Get all users (manager only)
 * @route GET /api/v1/users
 * @param {Request} req - Express request with query params { page?, limit?, role? }
 * @param {Response} res - Express response
 */
const getAll = async (req, res) => {
  const { page, limit, role } = req.query;

  const filters = {};
  if (role) {
    filters.role = role;
  }

  const pagination = { page, limit };

  const result = await usersService.getAllUsers(filters, pagination);

  return paginatedResponse(res, result.data, result.pagination);
};

/**
 * Create a new user (manager only)
 * Story 2.14: Manager User Management
 * @route POST /api/v1/users
 * @param {Request} req - Express request with validatedBody { email, firstName, lastName, role?, weeklyHoursTarget? }
 * @param {Response} res - Express response
 */
const create = async (req, res) => {
  const userData = req.validatedBody;

  const createdUser = await usersService.createUser(userData);

  return res.status(201).json({
    success: true,
    data: createdUser
  });
};

/**
 * Update a user (manager only)
 * Story 2.14: Manager User Management
 * @route PATCH /api/v1/users/:id
 * @param {Request} req - Express request with params.id and validatedBody { firstName?, lastName?, weeklyHoursTarget? }
 * @param {Response} res - Express response
 */
const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedBody;

  const updatedUser = await usersService.updateUser(id, updateData);

  return successResponse(res, updatedUser);
};

module.exports = { getMe, updateMe, getAll, create, update };
