const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Project = require("../models/project");
const AppError = require("../utils/AppError");
const APPROVAL_STATUS = require("../config/approvalStatus");
const ROLES = require("../config/roles");

/**
 * Expense Service
 * Handles all business logic for expense tracking management
 */

/**
 * Create a new expense
 * Auto-approval logic: PM/Admin submissions auto-approve
 * @param {object} expenseData - Expense data
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<object>} Created expense
 */
exports.createExpense = async (expenseData, user) => {
  // Validate Project exists using CUSTOM ID
  const project = await Project.findOne({ id: expenseData.project_id });

  if (!project) {
    throw new AppError("Project not found", 404);
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

  // Build expense object
  const newExpense = await Expense.create({
    id: `EXPENSE-${Date.now()}`,
    project_id: project._id, // Store ObjectId reference
    manager_id: project.manager_id, // Denormalized for performance
    user_id: user.id,
    title: expenseData.title,
    amount: expenseData.amount, // Setter will auto-round to 2 decimals
    currency: expenseData.currency,
    category: expenseData.category,
    date: expenseData.date,
    receipt_url: expenseData.receipt_url,
    status,
    approved_by,
    approved_at,
  });

  if (!newExpense) {
    throw new AppError("Failed to create expense", 500);
  }

  return newExpense;
};

/**
 * Get a single expense by ID
 * @param {string} expenseId - Expense custom ID (e.g., EXPENSE-123)
 * @returns {Promise<object>} Expense object
 */
exports.getExpenseById = async (expenseId) => {
  const expense = await Expense.findOne({ id: expenseId })
    .populate("project_id", "id name")
    .populate("user_id", "name email")
    .populate("approved_by", "name email");

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  return expense;
};

/**
 * Get all expenses with role-based filtering and pagination
 * @param {object} query - Query filters {project_id, status, category, user_id, page, limit}
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<object>} Paginated expenses with metadata
 */
exports.getAllExpenses = async (query, user) => {
  const PAGINATION = require("../config/pagination");
  const filter = {};

  // Role-based access control
  if (user.role === ROLES.TEAM_MEMBER) {
    // Staff can only see their own expenses
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
    // Admin can see all expenses
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

  if (query.category) {
    filter.category = query.category;
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
  const totalExpenses = await Expense.countDocuments(filter);
  const totalPages = Math.ceil(totalExpenses / limit);

  // Get paginated expenses
  const expenses = await Expense.find(filter)
    .populate("project_id", "id name")
    .populate("user_id", "name email")
    .populate("approved_by", "name email")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    data: expenses,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalExpenses,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Update an expense
 * Permission checks:
 * - Staff can only update their own expenses
 * - PM/Admin can update status (approve/reject)
 * @param {string} expenseId - Expense ObjectId
 * @param {object} updateData - Fields to update
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<object>} Updated expense
 */
exports.updateExpense = async (expenseId, updateData, user) => {
  const expense = await Expense.findOne({ id: expenseId });

  if (!expense) {
    throw new AppError("Expense not found", 404);
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
    expense.status = updateData.status;

    if (updateData.status === APPROVAL_STATUS.APPROVED) {
      expense.approved_by = user.id;
      expense.approved_at = new Date();
      expense.rejection_note = null;
    } else if (updateData.status === APPROVAL_STATUS.REJECTED) {
      expense.rejection_note = updateData.rejection_note;
      expense.approved_by = null;
      expense.approved_at = null;
    }
  } else {
    // Regular field updates
    // Staff can only update their own expenses
    if (
      user.role === ROLES.TEAM_MEMBER &&
      expense.user_id.toString() !== user.id
    ) {
      throw new AppError("You can only update your own expenses", 403);
    }

    // Update allowed fields
    if (updateData.title) expense.title = updateData.title;
    if (updateData.amount !== undefined) expense.amount = updateData.amount;
    if (updateData.currency) expense.currency = updateData.currency;
    if (updateData.category) expense.category = updateData.category;
    if (updateData.date) expense.date = updateData.date;
    if (updateData.receipt_url !== undefined)
      expense.receipt_url = updateData.receipt_url;
  }

  await expense.save();

  return expense;
};

/**
 * Get all expenses by project ID with pagination
 * @param {string} projectId - Project custom ID (e.g., PROJ-123)
 * @param {object} query - Query filters {status, category, page, limit}
 * @param {object} user - Authenticated user {id, role}
 * @returns {Promise<object>} Paginated expenses with metadata
 */
exports.getExpensesByProjectId = async (projectId, query, user) => {
  const PAGINATION = require("../config/pagination");

  // Validate Project exists using CUSTOM ID
  const project = await Project.findOne({ id: projectId });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const filter = {
    project_id: project._id,
  };

  // Role-based access control
  if (user.role === ROLES.TEAM_MEMBER) {
    // Staff can only see their own expenses
    filter.user_id = new mongoose.Types.ObjectId(String(user.id));
  }

  // Apply optional filters
  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
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
  const totalExpenses = await Expense.countDocuments(filter);
  const totalPages = Math.ceil(totalExpenses / limit);

  // Get paginated expenses
  const expenses = await Expense.find(filter)
    .populate("project_id", "id name")
    .populate("user_id", "name email")
    .populate("approved_by", "name email")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    data: expenses,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalExpenses,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};
