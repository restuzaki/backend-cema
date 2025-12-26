const express = require("express");
const router = express.Router();

const taskController = require("../controllers/taskController");

// Get tasks by project ID
router.get("/tasks/project/:projectId", taskController.getTasksByProjectId);

// Create new task
router.post("/tasks", taskController.createTask);

// Update task
router.put("/tasks/:id", taskController.updateTask);

// Delete task
router.delete("/tasks/:id", taskController.deleteTask);

module.exports = router;
