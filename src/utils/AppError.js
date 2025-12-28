/**
 * Custom Error Class for Operational Errors
 *
 * Used to throw errors with specific status codes and optional details.
 * All AppError instances are considered "operational" (expected errors)
 * vs programming errors (bugs).
 *
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (400, 404, 500, etc.)
 * @param {object|null} details - Optional additional data (e.g., validation errors array)
 *
 * @example
 * // Simple error
 * throw new AppError("User not found", 404);
 *
 * // Error with details (useful for validation)
 * throw new AppError("Validation failed", 400, {
 *   errors: [
 *     { field: "email", message: "Invalid email format" },
 *     { field: "password", message: "Password too short" }
 *   ]
 * });
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Optional: Attach extra data (e.g., which fields failed validation)
    this.details = details;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
