const mongoose = require("mongoose");
const TimeLog = require("../models/TimeLog");
const Project = require("../models/project");
const Task = require("../models/task");
const AppError = require("../utils/AppError");
const APPROVAL_STATUS = require("../config/approvalStatus");
const ROLES = require("../config/roles");

/**
 * TimeLog Service
 * Handles all business logic for time tracking management
 */

/**
 * Create a new time log
 * Auto-approval logic: PM/Admin submissions auto-approve
 * @param {object} logData - Time log data
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<object>} Created time log
 */
exports.createTimeLog = async (logData, user) => {
  // Validate Project exists using CUSTOM ID
  const project = await Project.findOne({ id: logData.project_id });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // If task_id provided, validate it exists and belongs to the project
  if (logData.task_id) {
    const task = await Task.findOne({ id: logData.task_id });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    // Ensure task belongs to the specified project
    if (task.project_id.toString() !== project._id.toString()) {
      throw new AppError("Task does not belong to the specified project", 400);
    }
  }

  // Auto-approval logic
  let status = APPROVAL_STATUS.PENDING;
  let approved_by = null;
  let approved_at = null;

  if (user.role === ROLES.PROJECT_MANAGER || user.role === ROLES.ADMIN) {
    status = APPROVAL_STATUS.APPROVED;
    approved_by = user.id;
    approved_at = new Date();
  }

  // Build time log object
  const newTimeLog = await TimeLog.create({
    id: `TIMELOG-${Date.now()}`,
    project_id: project._id, // Store ObjectId reference
    manager_id: project.manager_id, // Denormalized for performance
    task_id: logData.task_id
      ? (
          await Task.findOne({ id: logData.task_id })
        )?._id
      : null,
    user_id: user.id,
    start_at: logData.start_at,
    end_at: logData.end_at,
    description: logData.description,
    status,
    approved_by,
    approved_at,
    // duration_minutes will be auto-calculated by pre-save hook
  });

  if (!newTimeLog) {
    throw new AppError("Failed to create time log", 500);
  }

  return newTimeLog;
};

/**
 * Get a single time log by ID
 * @param {string} logId - TimeLog custom ID (e.g., TIMELOG-123)
 * @returns {Promise<object>} Time log object
 */
exports.getTimeLogById = async (logId) => {
  const timeLog = await TimeLog.findOne({ id: logId })
    .populate("project_id", "id name")
    .populate("task_id", "id title")
    .populate("user_id", "name email")
    .populate("approved_by", "name email");

  if (!timeLog) {
    throw new AppError("Time log not found", 404);
  }

  return timeLog;
};

/**
 * Get all time logs with role-based filtering and pagination
 * @param {object} query - Query filters {project_id, status, user_id, page, limit}
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<object>} Paginated time logs with metadata
 */
exports.getAllTimeLogs = async (query, user) => {
  const PAGINATION = require("../config/pagination");
  const filter = {};

  // Role-based access control
  if (user.role === ROLES.TEAM_MEMBER) {
    // Staff can only see their own logs
    filter.user_id = new mongoose.Types.ObjectId(String(user.id));
  } else if (user.role === ROLES.PROJECT_MANAGER) {
    // PM can filter by project_id if provided
    if (query.project_id) {
      const project = await Project.findOne({ id: query.project_id });
      if (!project) {
        throw new AppError("Project not found", 404);
      }
      filter.project_id = project._id;
    }
  } else if (user.role === ROLES.ADMIN) {
    // Admin can see all logs
    // Apply project_id filter if provided
    if (query.project_id) {
      const project = await Project.findOne({ id: query.project_id });
      if (!project) {
        throw new AppError("Project not found", 404);
      }
      filter.project_id = project._id;
    }
  }

  // Apply optional filters
  if (query.status) {
    filter.status = query.status;
  }

  // Admin/PM can filter by specific user_id
  if (
    query.user_id &&
    (user.role === ROLES.ADMIN || user.role === ROLES.PROJECT_MANAGER)
  ) {
    filter.user_id = new mongoose.Types.ObjectId(String(query.user_id));
  }

  // Parse pagination parameters
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  // Get total count
  const totalLogs = await TimeLog.countDocuments(filter);
  const totalPages = Math.ceil(totalLogs / limit);

  // Get paginated time logs
  const timeLogs = await TimeLog.find(filter)
    .populate("project_id", "id name")
    .populate("task_id", "id title")
    .populate("user_id", "name email")
    .populate("approved_by", "name email")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    data: timeLogs,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalLogs,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Update a time log
 * Permission checks:
 * - Staff can only update their own logs' description
 * - PM/Admin can update status (approve/reject)
 * @param {string} logId - TimeLog ObjectId
 * @param {object} updateData - Fields to update
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<object>} Updated time log
 */
exports.updateTimeLog = async (logId, updateData, user) => {
  const timeLog = await TimeLog.findOne({ id: logId });

  if (!timeLog) {
    throw new AppError("Time log not found", 404);
  }

  // Check if updating status (approval/rejection)
  if (updateData.status) {
    // Only PM/Admin can update status
    if (user.role !== ROLES.PROJECT_MANAGER && user.role !== ROLES.ADMIN) {
      throw new AppError(
        "Only Project Managers and Admins can update status",
        403
      );
    }

    // Handle status update
    timeLog.status = updateData.status;

    if (updateData.status === APPROVAL_STATUS.APPROVED) {
      timeLog.approved_by = user.id;
      timeLog.approved_at = new Date();
      timeLog.rejection_note = null;
    } else if (updateData.status === APPROVAL_STATUS.REJECTED) {
      timeLog.rejection_note = updateData.rejection_note;
      timeLog.approved_by = null;
      timeLog.approved_at = null;
    }
  } else {
    // Regular field updates (description, dates)
    // Staff can only update their own logs
    if (
      user.role === ROLES.TEAM_MEMBER &&
      timeLog.user_id.toString() !== user.id
    ) {
      throw new AppError("You can only update your own time logs", 403);
    }

    // Update allowed fields
    if (updateData.start_at) timeLog.start_at = updateData.start_at;
    if (updateData.end_at) timeLog.end_at = updateData.end_at;
    if (updateData.description !== undefined)
      timeLog.description = updateData.description;

    // Duration will be recalculated by pre-save hook if dates changed
  }

  await timeLog.save();

  return timeLog;
};
