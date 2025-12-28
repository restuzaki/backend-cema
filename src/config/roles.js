const ROLES = {
  ADMIN: "admin",
  PROJECT_MANAGER: "project_manager",
  TEAM_MEMBER: "staff", // Mapped to 'staff' in database based on user.js enum
  CLIENT: "client",
};

module.exports = ROLES;
