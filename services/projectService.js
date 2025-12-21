const mongoose = require("mongoose");
const Project = require("../models/project");
const { ACCESS_RULES } = require("../policies/abacPolicies");
const ROLES = require("../config/roles");

function injectProjectPermissions(userId, userRole) {
  const userIdStr = String(userId);
  const rules = ACCESS_RULES.PROJECT;

  // Helper to build condition from rule object
  const buildCondition = (rule) => {
    if (rule === true) return true;
    if (!rule) return false;

    const conditions = [];
    if (rule.owner_only) {
      conditions.push({ $eq: [{ $toString: "$manager_id" }, userIdStr] });
    }
    if (rule.max_budget) {
      conditions.push({
        $lt: ["$financials.budget_total", rule.max_budget],
      });
    }

    if (conditions.length === 0) return true;
    if (conditions.length === 1) return conditions[0];
    return { $and: conditions };
  };

  return [
    {
      $addFields: {
        _permissions: {
          can_edit: {
            $cond: {
              if: {
                $or: [
                  // Check specific role rule
                  buildCondition(
                    rules.EDIT[userRole] || rules.EDIT.DEFAULT || false
                  ),
                ],
              },
              then: true,
              else: false,
            },
          },
          can_delete: {
            $cond: {
              if: buildCondition(
                rules.DELETE[userRole] || rules.DELETE.DEFAULT || false
              ),
              then: true,
              else: false,
            },
          },
          can_view_financials: {
            $cond: {
              if: buildCondition(
                rules.VIEW_FINANCIALS[userRole] ||
                  rules.VIEW_FINANCIALS.DEFAULT ||
                  false
              ),
              then: true,
              else: false,
            },
          },
        },
      },
    },
  ];
}

/**
 * Get all projects with permission injection and role-based filtering
 * @param {Object} user - The authenticated user object
 * @returns {Promise<Array>} - List of projects
 */
exports.getAllProjects = async (user) => {
  const matchStage = {};

  // 1. Row-Level Security: Filter projects based on role
  if (user.role === ROLES.PROJECT_MANAGER) {
    matchStage.manager_id = new mongoose.Types.ObjectId(String(user.id));
  } else if (user.role === ROLES.CLIENT) {
    matchStage.client_id = new mongoose.Types.ObjectId(String(user.id));
  }

  const pipeline = [
    { $match: matchStage },
    // 2. Permission Injection
    ...injectProjectPermissions(user.id, user.role),
  ];

  // 3. Column-Level Security: Hide sensitive fields for Clients
  if (user.role === ROLES.CLIENT) {
    pipeline.push({ $project: { financials: 0, team_members: 0 } });
  }

  return await Project.aggregate(pipeline);
};

/**
 * Get project by ID with permission injection
 * @param {String} projectId - The project custom ID (e.g. PROJ-123)
 * @param {Object} user - The authenticated user object
 * @returns {Promise<Object>} - The project document or null
 */
exports.getProjectById = async (projectId, user) => {
  const matchStage = { id: projectId };

  // 1. Row-Level Security Enforce
  if (user.role === ROLES.PROJECT_MANAGER) {
    matchStage.manager_id = new mongoose.Types.ObjectId(String(user.id));
  } else if (user.role === ROLES.CLIENT) {
    matchStage.client_id = new mongoose.Types.ObjectId(String(user.id));
  }

  const pipeline = [
    { $match: matchStage },
    ...injectProjectPermissions(user.id, user.role),
  ];

  if (user.role === ROLES.CLIENT) {
    pipeline.push({ $project: { financials: 0, team_members: 0 } });
  }

  const results = await Project.aggregate(pipeline);
  return results[0] || null;
};

/**
 * Create a new project
 * @param {Object} projectData
 * @returns {Promise<Object>}
 */
exports.createProject = async (projectData) => {
  const newProject = await Project.create({
    id: `PROJ-${Date.now()}`,
    ...projectData,
    status: projectData.status || "LEAD",
    progress: projectData.progress || 0,
    financials: projectData.financials || {
      budget_total: projectData.budget || 0,
    },
  });
  return newProject;
};

/**
 * Update a project
 * @param {String} projectId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
exports.updateProject = async (projectId, updateData) => {
  const project = await Project.findOne({ id: projectId });
  if (!project) return null;

  Object.assign(project, updateData);
  await project.save();
  return project;
};

/**
 * Delete a project
 * @param {String} projectId
 * @returns {Promise<Object>}
 */
exports.deleteProject = async (projectId) => {
  return await Project.findOneAndDelete({ id: projectId });
};
