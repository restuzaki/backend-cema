const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");

// Get all projects
router.get("/projects", projectController.getAllProjects);

// Get project by ID
router.get("/projects/:id", projectController.getProjectById);

// Get projects by client ID
router.get("/projects/client/:clientId", projectController.getProjectsByClientId);

// Create new project
router.post("/projects", projectController.createProject);

// Update project
router.put("/projects/:id", projectController.updateProject);

// Delete project
router.delete("/projects/:id", projectController.deleteProject);

module.exports = router;
