// backend/validators/auth.validator.js

const { z } = require('zod');
const { validate } = require('../utils/validation');

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
 * Forgot password request validation schema
 * Validates email format only
 */
const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  validate
};
