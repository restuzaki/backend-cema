const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const validate = require("../middleware/validateRequest");
const {
  createTaskSchema,
  updateTaskSchema,
} = require("../validations/task.validation");
const taskController = require("../controllers/taskController");

// Get a single task by ID (must be before /tasks/project/:projectId to avoid conflict)
router.get(
  "/tasks/:id",
  authMiddleware,
  checkPermission("tasks", "view"),
  taskController.getTaskById
);

// Get tasks by project
router.get(
  "/tasks/project/:projectId",
  authMiddleware,
  checkPermission("tasks", "view"),
  taskController.getTasksByProject
);

// Create a new task
router.post(
  "/tasks",
  authMiddleware,
  checkPermission("tasks", "create"),
  validate(createTaskSchema),
  taskController.createTask
);

// Update a task
router.put(
  "/tasks/:id",
  authMiddleware,
  checkPermission("tasks", "update"),
  validate(updateTaskSchema),
  taskController.updateTask
);

// Delete a task
router.delete(
  "/tasks/:id",
  authMiddleware,
  checkPermission("tasks", "update"),
  taskController.deleteTask
);

module.exports = router;
