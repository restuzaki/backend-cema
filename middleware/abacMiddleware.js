const { hasPermission } = require("../policies/permissions");
const Project = require("../models/project");
const Task = require("../models/task");

const checkPermission = (resourceName, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthenticated" });

      let data = null;
      const resourceId = req.params.id || req.body.project_id;

      if (resourceId) {
        let Model;
        if (resourceName === "projects") Model = Project;
        if (resourceName === "tasks") Model = Task;

        data = await Model.findById(resourceId);

        if (!data) return res.status(404).json({ error: "Resource not found" });

        data = data.toObject();

        if (data._id) data.id = data._id.toString();
        if (data.manager_id) data.manager_id = data.manager_id.toString();
        if (data.client_id) data.client_id = data.client_id.toString();

        if (data.assigned_to && Array.isArray(data.assigned_to)) {
          data.assigned_to = data.assigned_to
            .filter((id) => id != null)
            .map((id) => id.toString());
        }
        if (data.team_members && Array.isArray(data.team_members)) {
          data.team_members = data.team_members
            .filter((id) => id != null)
            .map((id) => id.toString());
        }
      }

      const isAllowed = hasPermission(user, resourceName, action, data);

      if (!isAllowed) {
        return res.status(403).json({
          error: "Access Denied",
          reason: `Role '${user.role}' cannot '${action}' this resource.`,
        });
      }

      req.resource = data;
      next();
    } catch (err) {
      console.error("ABAC Error:", err);
      res.status(500).json({ error: "Authorization failed" });
    }
  };
};

module.exports = checkPermission;
