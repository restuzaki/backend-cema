/**
 * Pagination Constants
 * Centralized configuration for pagination across all endpoints
 */

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100, // Maximum items per page to prevent performance issues
};

module.exports = PAGINATION;
