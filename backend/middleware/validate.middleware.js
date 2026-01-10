// backend/middleware/validate.middleware.js

/**
 * Request validation middleware placeholder
 * TODO: Implement with Zod schemas
 *
 * This middleware will:
 * - Validate request body/query/params against Zod schema
 * - Return 400 with validation errors if invalid
 * - Pass validated data to next middleware
 */

/**
 * Creates a validation middleware for the specified schema
 * @param {Object} schema - Zod schema to validate against
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    // TODO: Implement validation logic with Zod
    // const result = schema.safeParse(req[source]);
    // if (!result.success) {
    //   return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
    //     details: result.error.issues
    //   }));
    // }
    // req[source] = result.data;
    next();
  };
};

module.exports = { validate };
