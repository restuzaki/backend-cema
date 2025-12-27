/**
 * Global Success Response Handler
 *
 * Standardizes all successful API responses across the application.
 * Ensures consistent response format and reduces code duplication.
 *
 * @param {Response} response - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {string} message - Optional success message
 * @param {any} data - Response data (object, array, etc.)
 * @param {object} meta - Optional metadata (pagination, total count, etc.)
 *
 * @example
 * // Simple success response
 * sendResponse(res, 200, null, projects);
 *
 * // Response with message
 * sendResponse(res, 201, "Project created successfully", newProject);
 *
 * // Response with metadata
 * sendResponse(res, 200, null, projects, { total: projects.length });
 */
const sendResponse = (
  response,
  statusCode = 200,
  message = null,
  data = null,
  meta = null
) => {
  const responseBody = {
    status: "success",
  };

  // Add message if provided
  if (message) {
    responseBody.message = message;
  }

  // Add metadata if provided (e.g., total count, pagination)
  if (meta) {
    Object.assign(responseBody, meta);
  }

  // Add data if provided
  if (data !== null) {
    responseBody.data = data;
  }

  response.status(statusCode).json(responseBody);
};

module.exports = sendResponse;
