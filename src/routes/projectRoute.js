const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const validate = require("../middleware/validateRequest");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validations/project.validation");

const projectController = require("../controllers/projectController");

// Get all projects
router.get(
  "/projects",
  authMiddleware,
  checkPermission("projects", "view"),
  projectController.getAllProjects
);

// Get project by ID
router.get(
  "/projects/:id",
  authMiddleware,
  checkPermission("projects", "view"),
  projectController.getProjectById
);

// Create new project
router.post(
  "/projects",
  authMiddleware,
  checkPermission("projects", "create"),
  validate(createProjectSchema),
  projectController.createProject
);

// Update project
router.put(
  "/projects/:id",
  authMiddleware,
  checkPermission("projects", "update"),
  validate(updateProjectSchema),
  projectController.updateProject
);

// Delete project
router.delete(
  "/projects/:id",
  authMiddleware,
  checkPermission("projects", "delete"),
  projectController.deleteProject
);

module.exports = router;
