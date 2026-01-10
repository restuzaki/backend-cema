const projectService = require("../services/projectService");
const notificationService = require("../services/notificationService");
const Project = require("../models/project");
const catchAsync = require("../utils/catchAsync");
const sendResponse = require("../utils/sendResponse");

/**
 * Get all projects
 * Applies role-based filtering and permission injection
 */
exports.getAllProjects = catchAsync(async (request, response) => {
  const projects = await projectService.getAllProjects(request.user);
  sendResponse(response, 200, null, projects, { total: projects.length });
});

/**
 * Get project by ID
 * Enforces row-level security based on user role
 */
exports.getProjectById = catchAsync(async (request, response) => {
  const project = await projectService.getProjectById(
    request.params.id,
    request.user
  );
  sendResponse(response, 200, null, project);
});

/**
 * Create new project
 * Validation handled by middleware
 */
exports.createProject = catchAsync(async (request, response) => {
  const newProject = await projectService.createProject(request.body);
  sendResponse(response, 201, "Project created successfully", newProject);
});

/**
 * Update project
 * Validation handled by middleware
 */
exports.updateProject = catchAsync(async (request, response) => {
  console.log("🔵 UPDATE PROJECT STARTED");
  const projectId = request.params.id;
  const updates = request.body;
  // Get the original project first to compare changes
  const originalProject = await Project.findOne({ id: projectId });
  console.log("🔍 Original Project:", originalProject);
  if (!originalProject) {
    return sendResponse(response, 404, "Project not found");
  }
  // Track which fields were updated
  const updatedFields = [];
  if (updates.name && updates.name !== originalProject.name) {
    updatedFields.push("name");
  }
  if (
    updates.description &&
    updates.description !== originalProject.description
  ) {
    updatedFields.push("description");
  }
  if (
    updates.startDate &&
    new Date(updates.startDate).getTime() !==
      originalProject.startDate?.getTime()
  ) {
    updatedFields.push("start date");
  }
  if (
    updates.endDate &&
    new Date(updates.endDate).getTime() !== originalProject.endDate?.getTime()
  ) {
    updatedFields.push("end date");
  }
  if (updates.status && updates.status !== originalProject.status) {
    updatedFields.push("status");
  }
  console.log("🔍 Updated Fields:", updatedFields);
  console.log("🔍 Manager ID:", originalProject.manager_id);
  // Update the project using your existing service
  const project = await projectService.updateProject(projectId, updates);
  // Send notification to project manager if any fields were updated
  if (updatedFields.length > 0 && originalProject.manager_id) {
    console.log("📤 SENDING NOTIFICATION...");
    notificationService
      .sendProjectUpdateNotification(
        originalProject.manager_id.toString(),
        project,
        updatedFields
      )
      .catch((err) => {
        console.error("Failed to send project update notification:", err);
      });
  } else {
    console.log("⚠️ NOT SENDING NOTIFICATION - Reason:", {
      hasUpdates: updatedFields.length > 0,
      hasManager: !!originalProject.manager_id,
    });
  }
  sendResponse(response, 200, "Project updated successfully", project);
});

/**
 * Delete project
 * Removes project from database
 */
exports.deleteProject = catchAsync(async (request, response) => {
  const projectId = request.params.id;
  await projectService.deleteProject(projectId);
  sendResponse(response, 200, "Project deleted successfully");
});
