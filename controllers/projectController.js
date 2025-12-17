const Project = require("../models/project");
const ROLES = require("../config/roles");
const PROJECTIONS = require("../config/projections");

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const user = req.user;

    // 1. Filter Strategy
    const filters = {
      [ROLES.PROJECT_MANAGER]: { manager_id: user.id },
      [ROLES.CLIENT]: { client_id: user.id },
    };
    const queryFilter = filters[user.role] || {};

    // 2. Build Query
    let dbQuery = Project.find(queryFilter);

    // 3. Apply Field Limiting for Clients
    if (user.role === ROLES.CLIENT) {
      dbQuery = dbQuery.select(PROJECTIONS.PROJECT.CLIENT_VIEW);
    }

    const projects = await dbQuery;

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
    const user = req.user;
    let query = Project.findOne({ id: req.params.id });

    // Apply Field Limiting for Clients
    if (user.role === ROLES.CLIENT) {
      query = query.select(PROJECTIONS.PROJECT.CLIENT_VIEW);
    }

    const project = await query;

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
    client_id,
    clientName,
    manager_id,
    managerName,
    admin_id,
    status,
    serviceType,
    startDate,
    endDate,
    progress,
    budget,
    description,
  } = req.body;

  // Validate required fields
  if (!name || !client_id || !clientName || !serviceType || !startDate) {
    return res.status(400).json({
      status: "error",
      error:
        "Required fields: name, clientId, clientName, serviceType, startDate",
    });
  }

  try {
    const newProject = await Project.create({
      id: `PROJ-${Date.now()}`,
      name,
      admin_id,
      client_id,
      clientName,
      manager_id,
      managerName,
      status: status || "LEAD", // Default to Valid Enum
      serviceType,
      startDate,
      endDate,
      progress: progress || 0,
      financials: req.body.financials || { budget_total: budget || 0 }, // Map financials
      description,
    });

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
    const project = await Project.findOne({ id: req.params.id });

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const {
      name,
      client_id,
      clientName,
      manager_id,
      managerName,
      admin_id,
      status,
      serviceType,
      startDate,
      endDate,
      progress,
      budget,
      description,
    } = req.body;

    // Update fields if provided
    if (name !== undefined) project.name = name;
    if (client_id !== undefined) project.client_id = client_id;
    if (clientName !== undefined) project.clientName = clientName;
    if (manager_id !== undefined) project.manager_id = manager_id;
    if (managerName !== undefined) project.managerName = managerName;
    if (admin_id !== undefined) project.admin_id = admin_id;
    if (status !== undefined) project.status = status;
    if (serviceType !== undefined) project.serviceType = serviceType;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (progress !== undefined) project.progress = progress;
    if (budget !== undefined) project.budget = budget;
    if (description !== undefined) project.description = description;

    await project.save();

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
    const project = await Project.findOneAndDelete({ id: req.params.id });

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
