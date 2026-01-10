// backend/middleware/error.middleware.js

/**
 * Global error handling middleware
 * MUST be registered last in Express middleware chain
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log server errors (5xx) for debugging - client errors (4xx) are expected
  if (statusCode >= 500 && process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      statusCode,
      code: errorCode,
      message,
      stack: err.stack
    });
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(err.details && { details: err.details })
    }
  });
};

module.exports = errorHandler;
