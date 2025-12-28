const timeLogService = require("../services/timeLog.service");
const catchAsync = require("../utils/catchAsync");
const sendResponse = require("../utils/sendResponse");

/**
 * Create a new time log
 * Validation handled by middleware
 */
exports.createTimeLog = catchAsync(async (request, response) => {
  const newTimeLog = await timeLogService.createTimeLog(
    request.body,
    request.user
  );

  sendResponse(response, 201, "Time log created successfully", newTimeLog);
});

/**
 * Get a single time log by ID
 */
exports.getTimeLogById = catchAsync(async (request, response) => {
  const timeLog = await timeLogService.getTimeLogById(request.params.id);

  sendResponse(response, 200, null, timeLog);
});

/**
 * Get all time logs with role-based filtering and pagination
 * Query params: project_id, status, user_id, page, limit (for Admin/PM)
 */
exports.getAllTimeLogs = catchAsync(async (request, response) => {
  const result = await timeLogService.getAllTimeLogs(
    request.query,
    request.user
  );

  sendResponse(response, 200, null, result.data, result.pagination);
});

/**
 * Update a time log
 * Validation and permission handled by middleware and service
 */
exports.updateTimeLog = catchAsync(async (request, response) => {
  const updatedTimeLog = await timeLogService.updateTimeLog(
    request.params.id,
    request.body,
    request.user
  );

  sendResponse(response, 200, "Time log updated successfully", updatedTimeLog);
});
