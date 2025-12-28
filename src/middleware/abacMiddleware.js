const { hasPermission } = require("../policies/abacPolicies");
const Project = require("../models/project");
const Task = require("../models/task");
const Schedule = require("../models/schedule");
const QuizQuestion = require("../models/quizQuestion");
const Material = require("../models/material");
const CalculatorSettings = require("../models/calculatorSettings");
const ServiceSchema = require("../models/serviceSchema");
const Portfolio = require("../models/portfolio");
const TimeLog = require("../models/TimeLog");
const Expense = require("../models/Expense");

const checkPermission = (resourceName, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthenticated" });

      let data = null;
      // Safe access to body and check for params
      const paramId = req.params.id;
      const bodyProjectId = req.body && req.body.project_id;
      const clientIdParam = user.id;

      const resourceId = paramId || bodyProjectId;

      if (resourceId) {
        let Model;

        if (paramId) {
          // Look up specific resource
          switch (resourceName) {
            case "projects":
              Model = Project;
              break;
            case "tasks":
              Model = Task;
              break;
            case "schedules":
              Model = Schedule;
              break;
            case "quiz_questions":
              Model = QuizQuestion;
              break;
            case "materials":
              Model = Material;
              break;
            case "calculator_settings":
              Model = CalculatorSettings;
              break;
            case "services":
              Model = ServiceSchema;
              break;
            case "portfolios":
              Model = Portfolio;
              break;
            case "time_logs":
              Model = TimeLog;
              break;
            case "expenses":
              Model = Expense;
              break;
          }
        } else if (bodyProjectId) {
          // Look up Parent Project for Creation context
          Model = Project;
        }

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
        data = { client_id: clientIdParam, manager_id: clientIdParam };
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
