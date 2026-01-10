// backend/controllers/users.controller.js

const usersService = require('../services/users.service');
const { successResponse } = require('../utils/response');

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

module.exports = { getMe, updateMe };
