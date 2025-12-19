const ROLES = require("../config/roles");

const POLICIES = {
  [ROLES.ADMIN]: {
    users: { view: true, create: true, update: true, delete: true },
    projects: { view: true, create: true, update: true, delete: true },
    tasks: { view: true, create: true, update: true, approve: true },
    schedules: { view: true, create: true, update: true, delete: true },
    quiz_questions: { view: true, create: true, update: true, delete: true },
    materials: { view: true, create: true, update: true, delete: true },
    calculator_settings: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
    services: { view: true, create: true, update: true, delete: true },
    portfolios: { view: true, create: true, update: true, delete: true },
  },
  [ROLES.PROJECT_MANAGER]: {
    projects: {
      view: (user, project) => project.manager_id === user.id,
      create: true,
      update: (user, project) => project.manager_id === user.id,
    },
    tasks: {
      view: true,
      create: true,
      approve: true, // Logic handled in middleware/controller to ensure ownership
    },
    schedules: {
      view: (user, schedule) => schedule.manager_id === user.id,
      create: true,
      update: (user, schedule) => schedule.manager_id === user.id,
    },
    quiz_questions: { view: true, create: false, update: false, delete: false },
    materials: { view: true, create: false, update: false, delete: false },
    calculator_settings: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    services: { view: true, create: false, update: false, delete: false },
    users: {
      view: (user, target) => user.id === target.id,
      create: false,
      update: (user, target) => user.id === target.id,
      delete: (user, target) => user.id === target.id,
    },
    portfolios: { view: true, create: false, update: false, delete: false },
  },
  [ROLES.TEAM_MEMBER]: {
    projects: {
      view: (user, project) =>
        project.team_members &&
        project.team_members.some((id) => id.toString() === user.id),
      create: false,
      update: false,
    },
    tasks: {
      view: true,
      create: false,
      update: (user, task) =>
        task.status !== "DONE" &&
        task.assigned_to?.some((id) => id.toString() === user.id),
      approve: false,
    },
    schedules: { view: false, create: false, update: false, delete: false },
    quiz_questions: { view: true, create: false, update: false, delete: false },
    materials: { view: true, create: false, update: false, delete: false },
    calculator_settings: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },
    services: { view: true, create: false, update: false, delete: false },
    portfolios: { view: true, create: false, update: false, delete: false },
    users: {
      view: (user, target) => user.id === target.id,
      create: false,
      update: (user, target) => user.id === target.id,
      delete: (user, target) => user.id === target.id,
    },
  },
  [ROLES.CLIENT]: {
    users: {
      view: (user, target) => user.id === target.id,
      update: (user, target) => user.id === target.id,
      create: false,
      delete: (user, target) => user.id === target.id,
    },
    projects: {
      view: (user, project) => project.client_id === user.id,
      create: true,
      update: false,
    },
    tasks: { view: false, create: false, update: false, approve: false },
    schedules: {
      view: (user, schedule) => schedule.client_id === user.id,
      create: true,
      update: (user, schedule) => schedule.client_id === user.id,
    },
    quiz_questions: { view: true, create: false, update: false, delete: false },
    materials: { view: true, create: false, update: false, delete: false },
    calculator_settings: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
    services: { view: true, create: false, update: false, delete: false },
    portfolios: { view: true, create: false, update: false, delete: false },
  },
};

function hasPermission(user, resource, action, data) {
  const rolePermissions = POLICIES[user.role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  const permission = resourcePermissions[action];
  if (permission == null) return false;

  if (typeof permission === "boolean") return permission;

  return data != null && permission(user, data);
}

module.exports = { hasPermission };
