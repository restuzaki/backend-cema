const Project = require("../models/project");
const ROLES = require("../config/roles");
const PROJECTIONS = require("../config/projections");

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
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
    const project = await Project.findOne({ id: req.params.id });

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

// Get projects by client ID
exports.getProjectsByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    const user = req.user;

    let query = Project.find({ client_id: clientId });

    // Apply Field Limiting for Clients
    if (user.role === ROLES.CLIENT) {
      query = query.select(PROJECTIONS.PROJECT.CLIENT_VIEW);
    }

    const projects = await query;

    res.json({
      status: "success",
      total: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch projects for client",
    });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  const {
    id,
    name,
    clientId,
    clientName,
    status,
    serviceType,
    startDate,
    endDate,
    progress,
    budget,
    description,
  } = req.body;

  // Validate required fields
  if (!name || !clientId || !clientName || !serviceType || !startDate) {
    return res.status(400).json({
      status: "error",
      error:
        "Required fields: name, clientId, clientName, serviceType, startDate",
    });
  }

  try {
    // Check if project with same ID already exists
    // const existingProject = await Project.findOne({ id });
    // if (existingProject) {
    //   return res.status(400).json({
    //     status: "error",
    //     error: "Project with this ID already exists",
    //   });
    // }

    const newProject = await Project.create({
      id: id || `PROJ-${Date.now()}`, 
      name,
      client_id: clientId, // Map clientId to client_id
      clientName,
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
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to create project",
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
      clientId,
      clientName,
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
    if (clientId !== undefined) project.clientId = clientId;
    if (clientName !== undefined) project.clientName = clientName;
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
      error: "Failed to update project",
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
