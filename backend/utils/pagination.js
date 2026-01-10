// backend/utils/pagination.js

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses pagination parameters from request query.
 * Enforces minimum and maximum values for page and limit.
 *
 * @param {Object} query - Request query object
 * @returns {Object} Parsed pagination parameters { page, limit, offset }
 */
const parsePaginationParams = (query) => {
  const parsedPage = parseInt(query.page, 10);
  const parsedLimit = parseInt(query.limit, 10);

  const page = Math.max(1, Number.isNaN(parsedPage) ? DEFAULT_PAGE : parsedPage);
  const rawLimit = Number.isNaN(parsedLimit) ? DEFAULT_LIMIT : parsedLimit;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Builds pagination metadata for response.
 *
 * @param {number} page - Current page number
 * @param {number} limit - Items per page (must be > 0)
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (page, limit, total) => {
  // Guard against invalid limit to prevent Infinity
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.ceil(total / safeLimit);
  return {
    page,
    limit: safeLimit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT
};
