// backend/controllers/auth.controller.js

const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');

/**
 * Handle user login
 * @route POST /api/v1/auth/login
 * @param {Request} req - Express request with validatedBody { email, password }
 * @param {Response} res - Express response
 */
const login = async (req, res) => {
  const { email, password } = req.validatedBody;

  const result = await authService.login(email, password);

  return successResponse(res, result);
};

/**
 * Handle user logout
 * @route POST /api/v1/auth/logout
 * @param {Request} req - Express request (requires valid Authorization header)
 * @param {Response} res - Express response
 */
const logout = async (req, res) => {
  // Extract access token from Authorization header (validated by auth middleware)
  const accessToken = req.accessToken;

  const result = await authService.logout(accessToken);

  return successResponse(res, result);
};

module.exports = { login, logout };
