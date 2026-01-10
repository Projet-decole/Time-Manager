// backend/controllers/health.controller.js

const healthService = require('../services/health.service');
const { successResponse } = require('../utils/response');
const { version } = require('../package.json');

/**
 * Basic health check endpoint - liveness probe
 * Always returns healthy if server is running
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const check = (req, res) => {
  return successResponse(res, {
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness check endpoint - verifies all dependencies are available
 * Used for: readiness probe (Kubernetes, Docker)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const ready = async (req, res) => {
  const checks = await healthService.runChecks();

  const allPassed = Object.values(checks).every(status => status === 'ok');
  const status = allPassed ? 'ready' : 'not ready';
  const statusCode = allPassed ? 200 : 503;

  return res.status(statusCode).json({
    success: allPassed,
    data: {
      status,
      checks
    }
  });
};

/**
 * Root endpoint - API welcome message
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const root = (req, res) => {
  return successResponse(res, {
    message: 'Time Manager API is running!',
    version
  });
};

module.exports = { check, ready, root };
