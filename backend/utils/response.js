// backend/utils/response.js

/**
 * Sends a success response with optional metadata.
 *
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Object|null} meta - Optional metadata (e.g., pagination)
 * @returns {Object} Express response
 */
const successResponse = (res, data, meta = null) => {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  return res.json(response);
};

/**
 * Sends an error response in standard format.
 *
 * @param {Object} res - Express response object
 * @param {Error|AppError} error - Error object
 * @returns {Object} Express response
 */
const errorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details || null
    }
  });
};

/**
 * Sends a paginated response with data and pagination metadata.
 *
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Express response
 */
const paginatedResponse = (res, data, pagination) => {
  return res.json({
    success: true,
    data,
    meta: { pagination }
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
