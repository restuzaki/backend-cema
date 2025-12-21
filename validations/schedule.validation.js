const { z } = require("zod");

/**
 * Zod Schema for Schedule Scheduling
 * Supports polymorphic payload for "EXISTING" project or "NEW" project (booking).
 */
const createScheduleSchema = z.discriminatedUnion("booking_type", [
  // Scenario A: Add schedule to EXISTING project
  z.object({
    booking_type: z.literal("EXISTING"),

    // Common Fields
    date: z.coerce.date(), // Accepts ISO string, etc.
    time: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)"
      ),
    event: z.string().min(1, "Event title is required"),
    description: z.string().optional(),
    isOnline: z.boolean(),
    location: z
      .object({
        address: z.string().optional(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      })
      .optional()
      .nullable(),
    link: z.string().url().optional().nullable(),

    // Scenario Specific
    project_id: z.string().min(1, "Project ID is required"),
  }),

  // Scenario B: Create NEW project (Booking)
  z.object({
    booking_type: z.literal("NEW"),

    // Common Fields
    date: z.coerce.date(),
    time: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)"
      ),
    event: z.string().min(1, "Event title is required"),
    description: z.string().optional(),
    isOnline: z.boolean(),
    location: z
      .object({
        address: z.string().optional(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      })
      .optional()
      .nullable(),
    link: z.string().url().optional().nullable(),

    // Scenario Specific
    clientName: z.string().min(1, "Client Name is required"),
    serviceType: z.string().min(1, "Service Type (ID) is required"), // Expecting ObjectId String
    projectDescription: z.string().optional(),
  }),
]);

module.exports = { createScheduleSchema };
