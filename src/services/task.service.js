const mongoose = require("mongoose");
const Task = require("../models/task");
const Project = require("../models/project");
const AppError = require("../utils/AppError");
const notificationService = require("./notificationService");

/**
 * Task Service
 * Handles all business logic for task management
 */

/**
 * Get a single task by ID
 * @param {string} taskId - Task custom ID (e.g., TASK-123)
 * @returns {Promise<object>} Task object
 */
exports.getTaskById = async (taskId) => {
  const task = await Task.findOne({ id: taskId });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

/**
 * Get tasks by project ID with pagination
 * @param {string} projectId - Project custom ID (e.g., PROJ-123)
 * @param {object} query - Query parameters {page, limit}
 * @returns {Promise<object>} Paginated tasks with metadata
 */
exports.getTasksByProject = async (projectId, query = {}) => {
  const PAGINATION = require("../config/pagination");

  // Validate project exists
  const project = await Project.findOne({ id: projectId });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Parse pagination parameters
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  // Get total count
  const totalTasks = await Task.countDocuments({ project_id: project._id });
  const totalPages = Math.ceil(totalTasks / limit);

  // Get paginated tasks
  const tasks = await Task.find({ project_id: project._id })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    data: tasks,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalTasks,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Create a new task
 * @param {object} taskData - Task data
 * @param {string} userId - ID of user creating the task
 * @returns {Promise<object>} Created task
 */
exports.createTask = async (taskData, userId) => {
  // Validate project exists using CUSTOM ID
  const project = await Project.findOne({ id: taskData.project_id });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Build task object explicitly (don't spread taskData to avoid project_id collision)
  const newTask = await Task.create({
    id: `TASK-${Date.now()}`,
    created_by: userId,
    project_id: project._id, // Store ObjectId reference, not custom ID
    assigned_to: taskData.assigned_to || [],
    title: taskData.title,
    description: taskData.description,
    budget_allocation: taskData.budget_allocation || 0,
    due_date: taskData.due_date,
    status: taskData.status || "TODO",
    attachments: taskData.attachments || [],
    is_punch_item: taskData.is_punch_item || false,
    approval: taskData.approval || false,
  });

  if (!newTask) {
    throw new AppError("Failed to create task", 500);
  }

  // Send notification to assigned staff members
  if (taskData.assigned_to && taskData.assigned_to.length > 0) {
    try {
      await notificationService.notifyTaskAssignment(
        newTask,
        taskData.assigned_to,
        taskData.project_id
      );
    } catch (error) {
      console.error("Failed to send task assignment notification:", error);
      // Don't fail the request if notification fails
    }
  }

  return newTask;
};

/**
 * Update an existing task
 * @param {string} taskId - Task custom ID (e.g., TASK-123)
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Updated task
 */
exports.updateTask = async (taskId, updateData) => {
  const task = await Task.findOneAndUpdate(
    { id: taskId },
    { $set: updateData },
    {
      new: true,
      // runValidators removed - Zod middleware handles all validation before this point
    }
  );

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Check if status changed to DONE - notify PM for approval
  if (updateData.status === "DONE") {
    try {
      const taskWithProject = await Task.findOne({ id: taskId }).populate(
        "project_id"
      );

      if (taskWithProject && taskWithProject.project_id) {
        await notificationService.notifyTaskCompletion(
          taskWithProject,
          taskWithProject.project_id.manager_id,
          taskWithProject.project_id.name
        );
      }
    } catch (error) {
      console.error("Failed to send task completion notification:", error);
      // Don't fail the request if notification fails
    }
  }

  return task;
};

/**
 * Delete a task
 * @param {string} taskId - Task custom ID (e.g., TASK-123)
 * @returns {Promise<object>} Deleted task
 */
exports.deleteTask = async (taskId) => {
  const task = await Task.findOneAndDelete({ id: taskId });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

/**
 * Get upcoming tasks (due within 7 days and not DONE)
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<Array>} List of upcoming tasks
 */
exports.getUpcomingTasks = async (user) => {
  const ROLES = require("../config/roles");
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const filter = {
    due_date: { $gte: new Date() },
    status: { $ne: "DONE" },
  };

  // Role-based filtering
  if (user.role === ROLES.PROJECT_MANAGER) {
    // PM sees tasks from their projects
    const Project = require("../models/project");
    const projects = await Project.find({
      manager_id: new mongoose.Types.ObjectId(String(user.id)),
    }).select("_id");
    filter.project_id = { $in: projects };
  } else if (user.role === ROLES.TEAM_MEMBER) {
    // Staff sees only their assigned tasks
    filter.assigned_to = new mongoose.Types.ObjectId(String(user.id));
  }
  // Admins see all tasks (no additional filter)

  const tasks = await Task.find(filter)
    .populate("project_id", "id name")
    .populate("assigned_to", "name email")
    .sort({ due_date: 1 }); // Sort by due date ascending

  return tasks;
};
