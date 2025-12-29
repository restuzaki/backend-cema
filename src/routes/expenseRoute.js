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

// Get expenses by project ID
router.get(
  "/expenses/project/:projectId",
  authMiddleware,
  checkPermission("expenses", "view"),
  expenseController.getExpensesByProjectId
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
