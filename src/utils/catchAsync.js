/**
 * Async Error Handler Wrapper
 *
 * Wraps async route handlers to automatically catch errors and pass them
 * to Express error handling middleware. Eliminates the need for try-catch
 * blocks in every controller function.
 *
 * Without this: Your server CRASHES if an async function throws an error
 * With this: Errors are caught and sent to the global error handler
 *
 * @param {Function} asyncControllerFunction - Async controller function to wrap
 * @returns {Function} Express middleware function
 *
 * @example
 * exports.getUsers = catchAsync(async (req, res) => {
 *   const users = await userService.getAllUsers();
 *   res.json({ status: "success", data: users });
 *   // No try-catch needed! Errors automatically caught
 * });
 */
const catchAsync = (asyncControllerFunction) => {
  return (request, response, next) => {
    // Execute the async function and catch any errors
    // If error occurs, pass it to Express error handler via next()
    Promise.resolve(asyncControllerFunction(request, response, next)).catch(
      next
    );
  };
};

module.exports = catchAsync;
