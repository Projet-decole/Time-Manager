// backend/utils/AppError.js

/**
 * Custom application error class for operational errors.
 * Extends native Error class with additional properties for
 * consistent error handling across the application.
 *
 * @extends Error
 */
class AppError extends Error {
  /**
   * Creates a new AppError instance.
   *
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (e.g., 400, 404, 500)
   * @param {string} code - Machine-readable error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
   * @param {Array|null} details - Optional field-level error details for validation errors
   */
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
