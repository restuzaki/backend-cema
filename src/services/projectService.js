const mongoose = require("mongoose");
const Project = require("../models/project");
const ServiceSchema = require("../models/serviceSchema");
const { ACCESS_RULES } = require("../policies/abacPolicies");
const ROLES = require("../config/roles");
const AppError = require("../utils/AppError");

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
    // Lookup Service Data
    {
      $lookup: {
        from: "serviceschemas",
        localField: "serviceType",
        foreignField: "_id",
        as: "serviceData",
      },
    },
    { $unwind: { path: "$serviceData", preserveNullAndEmptyArrays: true } },
    // 2. Permission Injection
    ...injectProjectPermissions(user.id, user.role),
  ];

  // 3. Column-Level Security: Hide sensitive fields for Clients
  if (user.role === ROLES.CLIENT) {
    pipeline.push({ $project: { financials: 0, team_members: 0 } });
  }

  const projects = await Project.aggregate(pipeline);

  if (!projects) {
    throw new AppError("Failed to fetch projects", 500);
  }

  return projects;
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
    // Lookup Service Data
    {
      $lookup: {
        from: "serviceschemas",
        localField: "serviceType",
        foreignField: "_id",
        as: "serviceData",
      },
    },
    { $unwind: { path: "$serviceData", preserveNullAndEmptyArrays: true } },
    // Lookup Tasks to calculate EV (Earned Value)
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "project_id",
        as: "tasks",
      },
    },
    // Lookup Expenses to calculate AV (Actual Cost)
    {
      $lookup: {
        from: "expenses",
        localField: "_id",
        foreignField: "project_id",
        as: "expenses",
      },
    },
    // Calculate Weighted EVM Metrics
    {
      $addFields: {
        // BAC (Budget at Completion)
        _bac: {
          $ifNull: ["$financials.budget_total", 0],
        },
        // EV (Earned Value) - Sum of budget_allocation for DONE tasks
        _ev: {
          $reduce: {
            input: "$tasks",
            initialValue: 0,
            in: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$$this.status", "DONE"] },
                    { $ifNull: ["$$this.budget_allocation", false] },
                  ],
                },
                then: {
                  $add: [
                    "$$value",
                    { $ifNull: ["$$this.budget_allocation", 0] },
                  ],
                },
                else: "$$value",
              },
            },
          },
        },
        // AV (Actual Cost) - Sum of approved expense amounts
        _av: {
          $reduce: {
            input: "$expenses",
            initialValue: 0,
            in: {
              $cond: {
                if: { $eq: ["$$this.status", "APPROVED"] },
                then: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
                else: "$$value",
              },
            },
          },
        },
        // Time ratio for PV calculation: (Now - StartDate) / (EndDate - StartDate)
        _timeRatio: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$startDate", null] },
                { $ne: ["$endDate", null] },
                { $gt: ["$endDate", "$startDate"] },
              ],
            },
            then: {
              $let: {
                vars: {
                  elapsed: { $subtract: [new Date(), "$startDate"] },
                  total: { $subtract: ["$endDate", "$startDate"] },
                },
                in: {
                  $min: [
                    1,
                    {
                      $cond: {
                        if: { $gt: ["$$total", 0] },
                        then: { $divide: ["$$elapsed", "$$total"] },
                        else: 0,
                      },
                    },
                  ],
                },
              },
            },
            else: 0,
          },
        },
      },
    },
    {
      $addFields: {
        // PV (Planned Value) - BAC * Time Ratio
        _pv: { $multiply: ["$_bac", "$_timeRatio"] },
        // Weighted Progress (%) - (EV / BAC) * 100
        progress: {
          $cond: {
            if: { $gt: ["$_bac", 0] },
            then: { $multiply: [{ $divide: ["$_ev", "$_bac"] }, 100] },
            else: 0,
          },
        },
        // Update financials object with EVM metrics
        financials: {
          budget_total: { $ifNull: ["$financials.budget_total", 0] },
          value_earned: "$_ev",
          cost_actual: "$_av",
          value_planned: "$_pv",
          // CPI (Cost Performance Index) - EV / AV
          cpi: {
            $cond: {
              if: { $gt: ["$_av", 0] },
              then: { $divide: ["$_ev", "$_av"] },
              else: null,
            },
          },
          // SPI (Schedule Performance Index) - EV / PV
          spi: {
            $cond: {
              if: { $gt: ["$_pv", 0] },
              then: { $divide: ["$_ev", "$_pv"] },
              else: null,
            },
          },
        },
      },
    },
    // Clean up temporary fields
    {
      $project: {
        tasks: 0,
        expenses: 0,
        _bac: 0,
        _ev: 0,
        _av: 0,
        _pv: 0,
        _timeRatio: 0,
      },
    },
    ...injectProjectPermissions(user.id, user.role),
  ];

  if (user.role === ROLES.CLIENT) {
    pipeline.push({ $project: { financials: 0, team_members: 0 } });
  }

  const results = await Project.aggregate(pipeline);

  if (!results || results.length === 0) {
    throw new AppError("Project not found", 404);
  }

  return results[0];
};

/**
 * Create a new project
 * @param {Object} projectData
 * @returns {Promise<Object>}
 */
exports.createProject = async (projectData) => {
  // 1. Validate that the service exists
  const service = await ServiceSchema.findById(projectData.serviceType);
  if (!service) {
    throw new AppError(`Invalid service type: Service not found`, 400);
  }

  const newProject = await Project.create({
    id: `PROJ-${Date.now()}`,
    ...projectData,
    serviceName: service.title, // Auto-populate Service Name
    status: projectData.status || "LEAD",
    progress: projectData.progress || 0,
    financials: projectData.financials || {
      budget_total: projectData.budget || 0,
    },
  });

  if (!newProject) {
    throw new AppError("Failed to create project", 500);
  }

  return newProject;
};

/**
 * Update a project
 * If manager_id changes, also updates all related time_logs and expenses
 * @param {String} projectId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
exports.updateProject = async (projectId, updateData) => {
  // Get old project to check if manager changed
  const oldProject = await Project.findOne({ id: projectId });

  if (!oldProject) {
    throw new AppError("Project not found", 404);
  }

  // Update the project
  const project = await Project.findOneAndUpdate(
    { id: projectId },
    { $set: updateData },
    {
      new: true,
      runValidators: false,
    }
  );

  // If manager_id changed, sync to all related time_logs and expenses
  if (
    updateData.manager_id &&
    oldProject.manager_id.toString() !== updateData.manager_id.toString()
  ) {
    const TimeLog = require("../models/TimeLog");
    const Expense = require("../models/Expense");

    // Bulk update all time logs for this project
    await TimeLog.updateMany(
      { project_id: project._id },
      { $set: { manager_id: updateData.manager_id } }
    );

    // Bulk update all expenses for this project
    await Expense.updateMany(
      { project_id: project._id },
      { $set: { manager_id: updateData.manager_id } }
    );
  }

  return project;
};

/**
 * Delete a project
 * @param {String} projectId
 * @returns {Promise<Object>}
 */
exports.deleteProject = async (projectId) => {
  const project = await Project.findOneAndDelete({ id: projectId });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};
