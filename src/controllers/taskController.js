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

/**
 * Approve or reject a task completion
 * This is a dedicated endpoint for PM to approve/reject completed tasks
 * Uses the updateTask service method internally
 */
exports.approveTask = catchAsync(async (request, response) => {
  const { is_approved, rejection_note } = request.body;

  // Validate is_approved is provided
  if (is_approved === undefined) {
    return sendResponse(
      response,
      400,
      "is_approved field is required (true or false)"
    );
  }

  // Prepare update data
  const updateData = {
    approval: {
      is_approved,
      approved_by: request.user.id,
      approved_at: is_approved ? new Date() : null,
      rejection_note: is_approved ? null : rejection_note,
    },
  };

  // Use existing updateTask service
  const updatedTask = await taskService.updateTask(
    request.params.id,
    updateData
  );

  const message = is_approved
    ? "Task approved successfully"
    : "Task completion rejected";

  sendResponse(response, 200, message, updatedTask);
});

/**
 * Get upcoming tasks (due within 7 days and not DONE)
 */
exports.getUpcomingTasks = catchAsync(async (request, response) => {
  const tasks = await taskService.getUpcomingTasks(request.user);

  sendResponse(response, 200, `Found ${tasks.length} upcoming tasks`, tasks);
});
