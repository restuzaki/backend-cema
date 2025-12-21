const Schedule = require("../models/schedule");
const Project = require("../models/project");
const ROLES = require("../config/roles");
const SCHEDULE_STATUS = require("../config/scheduleStatus");
const scheduleService = require("../services/scheduleService");
const { createScheduleSchema } = require("../validations/schedule.validation");

exports.getAllSchedules = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // Filter Strategy
    const filters = {
      [ROLES.PROJECT_MANAGER]: { manager_id: user.id },
      [ROLES.CLIENT]: { client_id: user.id },
    };

    query = filters[user.role] || {};

    const schedules = await Schedule.find(query);
    res.json({ status: "success", data: schedules });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", error: "Failed to fetch schedules" });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ id: req.params.id });
    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", error: "Schedule not found" });
    }
    res.json({ status: "success", data: schedule });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", error: "Failed to fetch schedule" });
  }
};

/**
 * Polymorphic Create Schedule Endpoint
 * Handles both "Add to Existing Project" and "Book New Project" scenarios.
 */
exports.createSchedule = async (req, res) => {
  const user = req.user;

  // 1. Zod Validation
  const validation = createScheduleSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: "error",
      error: "Validation failed",
      details: validation.error.errors,
    });
  }

  const { data } = validation;

  try {
    let newSchedule;

    // 2. Logic Switch based on booking_type
    switch (data.booking_type) {
      case "NEW":
        // Scenario B: Booking / New Project
        newSchedule = await scheduleService.createScheduleWithNewProject(
          {
            date: data.date,
            time: data.time,
            event: data.event,
            description: data.description,
            isOnline: data.isOnline,
            location: data.location,
            link: data.link,
          },
          {
            clientName: data.clientName,
            serviceType: data.serviceType,
            description: data.projectDescription,
          },
          user
        );
        break;

      case "EXISTING": {
        // Scenario A: Existing Project
        const project = await Project.findOne({ id: data.project_id });
        if (!project) {
          return res
            .status(404)
            .json({ status: "error", error: "Project not found" });
        }

        // Enforce PM Ownership Check
        if (
          user.role === ROLES.PROJECT_MANAGER &&
          project.manager_id.toString() !== user.id
        ) {
          return res.status(403).json({
            status: "error",
            error:
              "Unauthorized: You can only create schedules for your own projects.",
          });
        }

        newSchedule = await scheduleService.createSchedule({
          client_id: project.client_id, // Derived from Project
          manager_id: project.manager_id, // Derived from Project
          project_id: project._id, // Store ObjectId reference
          date: data.date,
          time: data.time,
          event: data.event,
          description: data.description,
          isOnline: data.isOnline,
          location: data.location,
          link: data.link,
        });
        break;
      }

      default:
        throw new Error("Invalid booking type");
    }

    res.status(201).json({
      status: "success",
      message: "Schedule created successfully",
      data: newSchedule,
    });
  } catch (error) {
    console.error("Create Schedule Error:", error);
    res.status(500).json({
      status: "error",
      error: error.message || "Failed to create schedule",
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ id: req.params.id });
    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", error: "Schedule not found" });
    }

    // Logic: Client check for date change
    const user = req.user;
    const { date, time, event, description, status, isOnline, location, link } =
      req.body;

    if (user.role === ROLES.CLIENT && date) {
      const newDate = new Date(date);
      const oldDate = new Date(schedule.date);
      if (newDate < oldDate) {
        return res.status(403).json({
          status: "error",
          error:
            "Clients cannot move schedule directly to an earlier date. Please contact Admin/PM.",
        });
      }
    }

    if (date) schedule.date = date;
    if (time) schedule.time = time;
    if (event) schedule.event = event;
    if (description) schedule.description = description;
    if (status) schedule.status = status;
    if (isOnline !== undefined) schedule.isOnline = isOnline;
    if (location) schedule.location = location;
    if (link) schedule.link = link;

    await schedule.save();

    res.json({
      status: "success",
      message: "Schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", error: "Failed to update schedule" });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ id: req.params.id });
    if (!schedule) {
      return res
        .status(404)
        .json({ status: "error", error: "Schedule not found" });
    }
    res.json({ status: "success", message: "Schedule deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", error: "Failed to delete schedule" });
  }
};
