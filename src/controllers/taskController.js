const taskService = require("../services/task.service");
const catchAsync = require("../utils/catchAsync");
const sendResponse = require("../utils/sendResponse");

/**
 * Get a single task by ID
 */
exports.getTaskById = catchAsync(async (request, response) => {
  const task = await taskService.getTaskById(request.params.id);

  sendResponse(response, 200, null, task);
});

/**
 * Get tasks by project ID with pagination
 */
exports.getTasksByProject = catchAsync(async (request, response) => {
  const result = await taskService.getTasksByProject(
    request.params.projectId,
    request.query
  );

  sendResponse(response, 200, null, result.data, result.pagination);
});

/**
 * Create a new task
 * Validation handled by middleware
 */
exports.createTask = catchAsync(async (request, response) => {
  const newTask = await taskService.createTask(request.body, request.user.id);

  sendResponse(response, 201, "Task created successfully", newTask);
});

/**
 * Update a task
 * Validation handled by middleware
 */
exports.updateTask = catchAsync(async (request, response) => {
  const task = await taskService.updateTask(request.params.id, request.body);

  sendResponse(response, 200, "Task updated successfully", task);
});

/**
 * Delete a task
 */
exports.deleteTask = catchAsync(async (request, response) => {
  await taskService.deleteTask(request.params.id);

  sendResponse(response, 200, "Task deleted successfully");
});
