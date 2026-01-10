// backend/controllers/health.controller.js

/**
 * Health check controller
 * Provides endpoints for monitoring service health
 */

/**
 * Basic health check endpoint
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const check = (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Root endpoint - API welcome message
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const root = (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Time Manager API is running!',
      version: '1.0.0'
    }
  });
};

module.exports = { check, root };
