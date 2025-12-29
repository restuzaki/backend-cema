const expenseService = require("../services/expense.service");
const catchAsync = require("../utils/catchAsync");
const sendResponse = require("../utils/sendResponse");

/**
 * Create a new expense
 * Validation handled by middleware
 */
exports.createExpense = catchAsync(async (request, response) => {
  const newExpense = await expenseService.createExpense(
    request.body,
    request.user
  );

  sendResponse(response, 201, "Expense created successfully", newExpense);
});

/**
 * Get a single expense by ID
 */
exports.getExpenseById = catchAsync(async (request, response) => {
  const expense = await expenseService.getExpenseById(request.params.id);

  sendResponse(response, 200, null, expense);
});

/**
 * Get all expenses with role-based filtering and pagination
 * Query params: project_id, status, category, user_id, page, limit (for Admin/PM)
 */
exports.getAllExpenses = catchAsync(async (request, response) => {
  const result = await expenseService.getAllExpenses(
    request.query,
    request.user
  );

  sendResponse(response, 200, null, result.data, result.pagination);
});

/**
 * Update an expense
 * Validation and permission handled by middleware and service
 */
exports.updateExpense = catchAsync(async (request, response) => {
  const updatedExpense = await expenseService.updateExpense(
    request.params.id,
    request.body,
    request.user
  );

  sendResponse(response, 200, "Expense updated successfully", updatedExpense);
});

/**
 * Get all expenses by project ID
 * Query params: status, category, page, limit
 */
exports.getExpensesByProjectId = catchAsync(async (request, response) => {
  const result = await expenseService.getExpensesByProjectId(
    request.params.projectId,
    request.query,
    request.user
  );

  sendResponse(response, 200, null, result.data, result.pagination);
});
