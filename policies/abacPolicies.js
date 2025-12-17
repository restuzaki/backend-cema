const ROLES = {
  ADMIN: {
    projects: { view: true, create: true, update: true, delete: true },
    tasks: { view: true, create: true, update: true, approve: true },
  },
  PROJECT_MANAGER: {
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
  },
  TEAM_MEMBER: {
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
  },
  CLIENT: {
    projects: {
      view: (user, project) => project.client_id === user.id,
      create: false,
      update: false,
    },
    tasks: { view: false, create: false, update: false, approve: false },
  },
};

function hasPermission(user, resource, action, data) {
  const rolePermissions = ROLES[user.role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  const permission = resourcePermissions[action];
  if (permission == null) return false;

  if (typeof permission === "boolean") return permission;

  return data != null && permission(user, data);
}

module.exports = { hasPermission };
