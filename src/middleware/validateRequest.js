const { z } = require("zod");
const AppError = require("../utils/AppError");

/**
 * Generic Zod Validation Middleware
 *
 * Validates request body against a Zod schema before the request reaches the controller.
 * Throws AppError with validation details if validation fails.
 * Replaces req.body with validated & sanitized data if successful.
 *
 * @param {z.ZodSchema} zodSchema - Zod schema to validate against
 * @returns {Function} Express middleware function
 *
 * @example
 * const validate = require("../middleware/validateRequest");
 * const { createProjectSchema } = require("../validations/project.validation");
 *
 * router.post("/projects", validate(createProjectSchema), projectController.create);
 */
const validate = (zodSchema) => {
  return (request, response, next) => {
    const validationResult = zodSchema.safeParse(request.body);

    if (!validationResult.success) {
      // Transform Zod errors into readable format
      const validationErrors =
        validationResult.error?.errors?.map((zodError) => ({
          // Convert path array to dot notation: ["location", "lat"] → "location.lat"
          field: zodError.path.join("."),
          message: zodError.message,
          code: zodError.code,
        })) || [];

      // Throw AppError with validation details
      return next(
        new AppError("Validation failed", 400, { errors: validationErrors })
      );
    }

    // Replace req.body with validated & sanitized data
    // This ensures type safety and removes unknown fields
    request.body = validationResult.data;

    next();
  };
};

module.exports = validate;
