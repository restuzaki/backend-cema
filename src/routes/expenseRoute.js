const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const validate = require("../middleware/validateRequest");
const {
  createExpenseSchema,
  updateExpenseSchema,
} = require("../validations/expense.validation");
const expenseController = require("../controllers/expenseController");

// Create expense
router.post(
  "/expenses",
  authMiddleware,
  checkPermission("expenses", "create"),
  validate(createExpenseSchema),
  expenseController.createExpense
);

// Get expense by ID
router.get(
  "/expenses/:id",
  authMiddleware,
  checkPermission("expenses", "view"),
  expenseController.getExpenseById
);

// Get all expenses (with role-based filtering in service layer)
router.get(
  "/expenses",
  authMiddleware,
  checkPermission("expenses", "view"),
  expenseController.getAllExpenses
);

// Get pending expenses (awaiting approval)
router.get(
  "/expenses/pending",
  authMiddleware,
  checkPermission("expenses", "view"),
  expenseController.getPendingExpenses
);

// Get expenses by project ID
router.get(
  "/expenses/project/:projectId",
  authMiddleware,
  checkPermission("expenses", "view"),
  expenseController.getExpensesByProjectId
);

// Approve/Reject expense (must be before /expenses/:id to avoid route conflict)
router.put(
  "/expenses/:id/approve",
  authMiddleware,
  checkPermission("expenses", "approve"),
  expenseController.approveExpense
);

// Update expense (includes status updates)
router.put(
  "/expenses/:id",
  authMiddleware,
  checkPermission("expenses", "update"),
  validate(updateExpenseSchema),
  expenseController.updateExpense
);

module.exports = router;
