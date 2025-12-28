const projectService = require("../services/projectService");
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
  const project = await projectService.updateProject(
    request.params.id,
    request.body
  );

  sendResponse(response, 200, "Project updated successfully", project);
});

/**
 * Delete project
 * Authorization checked by ABAC middleware
 */
exports.deleteProject = catchAsync(async (request, response) => {
  await projectService.deleteProject(request.params.id);

  sendResponse(response, 200, "Project deleted successfully");
});
