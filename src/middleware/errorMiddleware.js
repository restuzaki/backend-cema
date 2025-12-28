const AppError = require("../utils/AppError");

/**
 * Global Error Handler Middleware
 *
 * Centralized error handling for the entire application.
 * Handles operational errors (AppError), Mongoose errors, and unexpected errors.
 *
 * ALWAYS returns generic "Internal server error" to client for security.
 * ALWAYS logs detailed error information server-side for debugging.
 *
 * @param {Error} error - Error object
 * @param {Request} request - Express request
 * @param {Response} response - Express response
 * @param {NextFunction} next - Express next function
 */
const errorHandler = (error, request, response, next) => {
  let { statusCode = 500, message } = error;

  // ========================================
  // 1. OPERATIONAL ERRORS (AppError)
  // ========================================
  // These are expected errors that we throw intentionally
  if (error instanceof AppError) {
    return response.status(statusCode).json({
      status: "error",
      message,
      ...(error.details && { details: error.details }),
    });
  }

  // ========================================
  // 2. MONGOOSE VALIDATION ERRORS
  // ========================================
  if (error.name === "ValidationError") {
    return response.status(400).json({
      status: "error",
      message: "Validation error",
      details: Object.values(error.errors).map((validationError) => ({
        field: validationError.path,
        message: validationError.message,
      })),
    });
  }

  // ========================================
  // 3. MONGOOSE DUPLICATE KEY ERRORS
  // ========================================
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue).join(", ");
    return response.status(400).json({
      status: "error",
      message: `Duplicate value for field: ${duplicateField}`,
      details: { field: duplicateField, value: error.keyValue },
    });
  }

  // ========================================
  // 4. MONGOOSE CAST ERRORS (Invalid ObjectId)
  // ========================================
  if (error.name === "CastError") {
    return response.status(400).json({
      status: "error",
      message: `Invalid ${error.path}: ${error.value}`,
    });
  }

  // ========================================
  // 5. JWT ERRORS
  // ========================================
  if (error.name === "JsonWebTokenError") {
    return response.status(401).json({
      status: "error",
      message: "Invalid token. Please log in again.",
    });
  }

  if (error.name === "TokenExpiredError") {
    return response.status(401).json({
      status: "error",
      message: "Your token has expired. Please log in again.",
    });
  }

  // ========================================
  // 6. UNEXPECTED ERRORS
  // ========================================
  // ALWAYS log the full error server-side for debugging
  console.error("💥 UNEXPECTED ERROR:");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  console.error("Full Error:", error);

  // ALWAYS return generic message to client (security best practice)
  response.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

module.exports = errorHandler;
