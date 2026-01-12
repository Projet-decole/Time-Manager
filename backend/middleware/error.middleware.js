// backend/middleware/error.middleware.js

const AppError = require('../utils/AppError');

/**
 * Global error handling middleware
 * MUST be registered last in Express middleware chain
 * Signature: (err, req, res, next) - 4 parameters required for Express error middleware
 */
const errorHandler = (err, req, res, next) => {
  // Build structured log data
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    code: err.code || 'INTERNAL_ERROR'
  };

  // Determine if this is an operational error (AppError) or unexpected error
  const isOperational = err instanceof AppError;

  // Handle JSON parsing errors from body-parser (client error)
  const isJsonParseError = err instanceof SyntaxError && err.type === 'entity.parse.failed';

  // Log errors
  if (process.env.NODE_ENV === 'development') {
    // In development, log everything including stack trace for debugging
    console.error('[ERROR]', logData, err.stack);
  } else {
    // In production, log structured data only (no stack traces)
    console.error('[ERROR]', logData);
  }

  // Handle AppError (operational errors) - these are safe to expose to client
  if (isOperational) {
    const errorResponse = {
      code: err.code,
      message: err.message,
      details: err.details
    };

    // Include additional data if present (e.g., active timer data for TIMER_ALREADY_RUNNING)
    // Story 4.2: Simple Mode Start Timer API - AC2
    if (err.data) {
      errorResponse.data = err.data;
    }

    return res.status(err.statusCode).json({
      success: false,
      error: errorResponse
    });
  }

  // Handle JSON parse errors as 400 Bad Request (client error)
  if (isJsonParseError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON in request body',
        details: null
      }
    });
  }

  // Handle unknown/unexpected errors
  const statusCode = 500;

  // In production (or undefined NODE_ENV), hide actual error message for security
  // Default to secure behavior when NODE_ENV is not explicitly set to 'development'
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      details: null
    }
  });
};

module.exports = errorHandler;
