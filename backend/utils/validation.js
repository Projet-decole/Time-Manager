// backend/utils/validation.js

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

module.exports = { validate };
