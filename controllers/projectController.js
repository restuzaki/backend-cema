const projectService = require("../services/projectService");

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await projectService.getAllProjects(req.user);

    res.json({
      status: "success",
      total: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch projects",
    });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user
    );

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    res.json({
      status: "success",
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch project",
    });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  const {
    name,
    description,
    admin_id,
    client_id,
    clientName,
    manager_id,
    managerName,
    team_members,
    status,
    serviceType,
    location,
    startDate,
    endDate,
    financials,
    documents,
  } = req.body;

  // Validate required fields (matching Schema)
  const requiredFields = [
    "name",
    "admin_id",
    "client_id",
    "clientName",
    "manager_id",
    "managerName",
    "serviceType",
    "startDate",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: "error",
      error: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    const newProject = await projectService.createProject(req.body);

    res.status(201).json({
      status: "success",
      message: "Project created successfully",
      data: newProject,
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    res.json({
      status: "success",
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await projectService.deleteProject(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    res.json({
      status: "success",
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to delete project",
    });
  }
};
