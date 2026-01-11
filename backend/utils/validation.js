// backend/utils/validation.js

const AppError = require('./AppError');

/**
 * UUID v4 regex pattern for validation
 * @type {RegExp}
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate request body against a Zod schema
 * Shared validation middleware for all validators
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    // Handle undefined or null body
    const body = req.body || {};
    const result = schema.safeParse(body);

    if (!result.success) {
      // Zod v4 uses .issues instead of .errors
      const zodErrors = result.error.issues || result.error.errors || [];
      const errors = zodErrors.map(err => ({
        field: err.path.join('.') || err.path[0] || 'body',
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        }
      });
    }

    req.validatedBody = result.data;
    next();
  };
};

/**
 * Validate that a route parameter is a valid UUID
 * @param {string} paramName - Name of the route parameter to validate (default: 'id')
 * @returns {Function} Express middleware function
 */
const validateUUID = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!value || !UUID_REGEX.test(value)) {
      return next(new AppError(`Invalid ${paramName} format`, 400, 'INVALID_ID'));
    }

    next();
  };
};

module.exports = { validate, validateUUID };
