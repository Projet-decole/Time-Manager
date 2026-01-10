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

module.exports = { login };
