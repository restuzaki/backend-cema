const { hasPermission } = require("../policies/abacPolicies");
const Project = require("../models/project");
const Task = require("../models/task");

const checkPermission = (resourceName, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthenticated" });

      let data = null;
      // Safe access to body and check for params
      const resourceId = req.params.id || (req.body && req.body.project_id);
      const clientIdParam = req.params.clientId;

      if (resourceId) {
        let Model;
        if (resourceName === "projects") Model = Project;
        if (resourceName === "tasks") Model = Task;

        // Determine lookup method based on resource
        if (Model) {
             data = await Model.findOne({ id: resourceId });
        }

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
      } else if (clientIdParam) {
        // Mock data for Client List route to satisfy ABAC policy (user.id === project.client_id)
        data = { client_id: clientIdParam };
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
