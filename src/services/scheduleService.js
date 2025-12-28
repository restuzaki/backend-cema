const mongoose = require("mongoose");
const Schedule = require("../models/schedule");
const Project = require("../models/project");
const ServiceSchema = require("../models/serviceSchema");
const User = require("../models/User");
const ROLES = require("../config/roles");
const AppError = require("../utils/AppError");

/**
 * Standard Schedule Creation (Scenario A)
 * Adds a schedule to an EXISTING project.
 * @param {Object} data - Schedule data
 * @returns {Promise<Object>} Created Schedule
 */
exports.createSchedule = async (scheduleData) => {
  const newSchedule = await Schedule.create({
    id: `SCH-${Date.now()}`,
    ...scheduleData,
    status: "UPCOMING",
  });

  if (!newSchedule) {
    throw new AppError("Failed to create schedule", 500);
  }

  return newSchedule;
};

/**
 * Create a Schedule and a Project atomically (Transaction)
 * Scenario B: Booking / Request Consultation
 * @param {Object} scheduleData - Data for the schedule
 * @param {Object} projectData - Data for the project (clientName, serviceType, description)
 * @param {Object} user - The authenticated user (Client)
 * @returns {Promise<Object>} Created Schedule populated with Project
 */
exports.createScheduleWithNewProject = async (
  scheduleData,
  projectData,
  user
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate Service Exists
    const service = await ServiceSchema.findById(
      projectData.serviceType
    ).session(session);

    if (!service) {
      throw new AppError(`Invalid service type: Service not found`, 400);
    }

    // 2. Find Default Admin/Manager (Required by Schema)
    // We pick the first Admin found to assign as initial manager for "LEAD" status.
    const defaultAdmin = await User.findOne({ role: ROLES.ADMIN }).session(
      session
    );

    const defaultManager = await User.findOne({
      role: ROLES.PROJECT_MANAGER,
    }).session(session);

    if (!defaultAdmin) {
      throw new AppError(
        "System configuration error: No Admin user found. Please contact support.",
        500
      );
    }

    // 3. Create Project
    const createdProject = await Project.create(
      [
        {
          id: `PROJ-${Date.now()}`,
          name: `${service.title} - ${user.name}`, // Auto-generate name
          description:
            projectData.projectDescription || `Booking via ${service.title}`,

          admin_id: defaultAdmin._id,

          client_id: user.id,
          clientName: projectData.clientName || user.name,

          manager_id: defaultManager._id, // Assign to Admin initially
          managerName: defaultManager.name || "System Admin",

          serviceType: service._id,
          serviceName: service.title,

          startDate: scheduleData.date, // Start date aligns with consultation

          status: "LEAD",
          progress: 0,
          financials: {
            budget_total: 0,
            cost_actual: 0,
            value_planned: 0,
            value_earned: 0,
            cpi: 0,
            spi: 0,
          },
        },
      ],
      { session }
    );

    const project = createdProject[0];

    // 4. Create Schedule
    const createdSchedule = await Schedule.create(
      [
        {
          id: `SCH-${Date.now()}`,
          client_id: project.client_id,
          manager_id: project.manager_id,
          project_id: project._id,

          date: scheduleData.date,
          time: scheduleData.time,
          event: scheduleData.event || "Initial Consultation",
          description: scheduleData.description,

          isOnline: scheduleData.isOnline,
          location: scheduleData.isOnline ? null : scheduleData.location,
          link: scheduleData.isOnline ? scheduleData.link : null,

          status: "UPCOMING",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Return the schedule populated with project info
    return await Schedule.findById(createdSchedule[0]._id).populate(
      "project_id"
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Re-throw AppError as-is, wrap other errors
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error.message || "Failed to create schedule and project",
      500
    );
  }
};
