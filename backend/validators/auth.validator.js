// backend/validators/auth.validator.js

const { z } = require('zod');

/**
 * Login request validation schema
 * Validates email format and password presence
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
});

/**
 * Validate request body against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
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

module.exports = {
  loginSchema,
  validate
};
