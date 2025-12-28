const { z } = require("zod");
const APPROVAL_STATUS = require("../config/approvalStatus");

/**
 * Zod Validation Schemas for TimeLog Module
 *
 * Validates time tracking entries with strict Date object validation
 * and auto-approval logic for PM/Admin roles.
 */

// ========================================
// CREATE TIMELOG SCHEMA
// ========================================

const createTimeLogSchema = z
  .object({
    // Required fields
    project_id: z.string().min(1, "Project ID is required"),
    start_at: z.coerce.date({
      errorMap: () => ({ message: "start_at must be a valid Date" }),
    }),
    end_at: z.coerce.date({
      errorMap: () => ({ message: "end_at must be a valid Date" }),
    }),

    // Optional fields
    task_id: z.string().optional(),
    description: z.string().optional(),
  })
  .refine((data) => data.end_at > data.start_at, {
    message: "end_at must be after start_at",
    path: ["end_at"],
  });

// ========================================
// UPDATE TIMELOG SCHEMA
// ========================================

const updateTimeLogSchema = z
  .object({
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional(),
    description: z.string().optional(),
    status: z
      .enum([
        APPROVAL_STATUS.PENDING,
        APPROVAL_STATUS.APPROVED,
        APPROVAL_STATUS.REJECTED,
      ])
      .optional(),
    rejection_note: z.string().optional(),
  })
  .refine(
    (data) => {
      // If both start_at and end_at are provided, validate end_at > start_at
      if (data.start_at && data.end_at) {
        return data.end_at > data.start_at;
      }
      return true;
    },
    {
      message: "end_at must be after start_at",
      path: ["end_at"],
    }
  )
  .refine(
    (data) => {
      // If status is REJECTED, rejection_note is required
      if (data.status === APPROVAL_STATUS.REJECTED) {
        return data.rejection_note && data.rejection_note.trim().length > 0;
      }
      return true;
    },
    {
      message: "rejection_note is required when status is REJECTED",
      path: ["rejection_note"],
    }
  );

module.exports = {
  createTimeLogSchema,
  updateTimeLogSchema,
};
