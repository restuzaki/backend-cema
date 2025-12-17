const Project = require("../models/project");

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
    const projects = await Project.find({ clientId: req.params.clientId });

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
  if (!id || !name || !clientId || !clientName || !serviceType || !startDate) {
    return res.status(400).json({
      status: "error",
      error:
        "Required fields: id, name, clientId, clientName, serviceType, startDate",
    });
  }

  try {
    // Check if project with same ID already exists
    const existingProject = await Project.findOne({ id });
    if (existingProject) {
      return res.status(400).json({
        status: "error",
        error: "Project with this ID already exists",
      });
    }

    const newProject = await Project.create({
      id,
      name,
      clientId,
      clientName,
      status: status || "Not Started",
      serviceType,
      startDate,
      endDate,
      progress: progress || 0,
      budget,
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
