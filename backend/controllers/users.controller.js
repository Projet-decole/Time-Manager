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

module.exports = { getMe, updateMe, getAll };
