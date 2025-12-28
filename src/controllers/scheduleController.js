const Schedule = require("../models/schedule");
const Project = require("../models/project");
const ROLES = require("../config/roles");
const scheduleService = require("../services/scheduleService");
const catchAsync = require("../utils/catchAsync");
const sendResponse = require("../utils/sendResponse");
const AppError = require("../utils/AppError");

/**
 * Get all schedules
 * Filtered by user role (PM sees their projects, Clients see their schedules)
 */
exports.getAllSchedules = catchAsync(async (request, response) => {
  const user = request.user;
  let query = {};

  // Filter Strategy based on role
  const filters = {
    [ROLES.PROJECT_MANAGER]: { manager_id: user.id },
    [ROLES.CLIENT]: { client_id: user.id },
  };

  query = filters[user.role] || {};

  const schedules = await Schedule.find(query);

  sendResponse(response, 200, null, schedules);
});

/**
 * Get schedule by ID
 */
exports.getScheduleById = catchAsync(async (request, response) => {
  const schedule = await Schedule.findOne({ id: request.params.id });

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  sendResponse(response, 200, null, schedule);
});

/**
 * Polymorphic Create Schedule Endpoint
 * Handles both "Add to Existing Project" and "Book New Project" scenarios
 * Validation handled by middleware
 */
exports.createSchedule = catchAsync(async (request, response) => {
  const user = request.user;
  const requestData = request.body;

  let newSchedule;

  // Logic Switch based on booking_type
  switch (requestData.booking_type) {
    case "NEW":
      // Scenario B: Booking / New Project
      newSchedule = await scheduleService.createScheduleWithNewProject(
        {
          date: requestData.date,
          time: requestData.time,
          event: requestData.event,
          description: requestData.description,
          isOnline: requestData.isOnline,
          location: requestData.location,
          link: requestData.link,
        },
        {
          clientName: requestData.clientName,
          serviceType: requestData.serviceType,
          projectDescription: requestData.projectDescription,
        },
        user
      );
      break;

    case "EXISTING": {
      // Scenario A: Existing Project
      const project = await Project.findOne({ id: requestData.project_id });

      if (!project) {
        throw new AppError("Project not found", 404);
      }

      // Enforce PM Ownership Check
      if (
        user.role === ROLES.PROJECT_MANAGER &&
        project.manager_id.toString() !== user.id
      ) {
        throw new AppError(
          "Unauthorized: You can only create schedules for your own projects",
          403
        );
      }

      newSchedule = await scheduleService.createSchedule({
        client_id: project.client_id, // Derived from Project
        manager_id: project.manager_id, // Derived from Project
        project_id: project._id, // Store ObjectId reference
        date: requestData.date,
        time: requestData.time,
        event: requestData.event,
        description: requestData.description,
        isOnline: requestData.isOnline,
        location: requestData.location,
        link: requestData.link,
      });
      break;
    }

    default:
      throw new AppError("Invalid booking type", 400);
  }

  sendResponse(response, 201, "Schedule created successfully", newSchedule);
});

/**
 * Update schedule
 * Business Rule: Clients cannot move schedules to earlier dates
 * Validation handled by middleware
 */
exports.updateSchedule = catchAsync(async (request, response) => {
  const schedule = await Schedule.findOne({ id: request.params.id });

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  const user = request.user;
  const { date, time, event, description, status, isOnline, location, link } =
    request.body;

  // Business Rule: Client date restriction
  if (user.role === ROLES.CLIENT && date) {
    const newDate = new Date(date);
    const oldDate = new Date(schedule.date);

    if (newDate < oldDate) {
      throw new AppError(
        "Clients cannot move schedule to an earlier date. Please contact Admin/PM.",
        403
      );
    }
  }

  // Update fields
  if (date) schedule.date = date;
  if (time) schedule.time = time;
  if (event) schedule.event = event;
  if (description) schedule.description = description;
  if (status) schedule.status = status;
  if (isOnline !== undefined) schedule.isOnline = isOnline;
  if (location) schedule.location = location;
  if (link) schedule.link = link;

  await schedule.save();

  sendResponse(response, 200, "Schedule updated successfully", schedule);
});

/**
 * Delete schedule
 */
exports.deleteSchedule = catchAsync(async (request, response) => {
  const schedule = await Schedule.findOneAndDelete({ id: request.params.id });

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  sendResponse(response, 200, "Schedule deleted successfully");
});
