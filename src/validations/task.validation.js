const { z } = require("zod");

/**
 * Zod Validation Schemas for Task Module
 *
 * Tasks support attachments, approvals, and punch items for construction management.
 */

// ========================================
// REUSABLE SUB-SCHEMAS
// ========================================

// Attachment schema
const attachmentSchema = z.object({
  type: z.enum(["FILE", "IMAGE", "LINK"], {
    errorMap: () => ({
      message: "Attachment type must be FILE, IMAGE, or LINK",
    }),
  }),
  url: z.url("Invalid attachment URL"),
  name: z.string().min(1, "Attachment name is required"),
  uploaded_at: z.coerce.date().optional(),
});

// Approval schema
const approvalSchema = z.object({
  is_approved: z.boolean().optional().default(false),
  approved_by: z.string().optional().nullable(),
  rejection_note: z.string().optional().nullable(),
  approved_at: z.coerce.date().optional().nullable(),
});

// ========================================
// CREATE TASK SCHEMA
// ========================================

const createTaskSchema = z.object({
  // Required fields
  project_id: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Task title is required").max(200, "Title too long"),

  // Optional fields
  assigned_to: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
  budget_allocation: z
    .number()
    .min(0, "Budget cannot be negative")
    .optional()
    .default(0),
  due_date: z.coerce.date().optional(),
  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .optional()
    .default("TODO"),
  attachments: z.array(attachmentSchema).optional().default([]),
  is_punch_item: z.boolean().optional().default(false),
  approval: approvalSchema.optional(),
});

// ========================================
// UPDATE TASK SCHEMA
// ========================================

const updateTaskSchema = z.object({
  // All fields optional for partial updates
  assigned_to: z.array(z.string()).optional(),
  title: z.string().min(1, "Title cannot be empty").max(200).optional(),
  description: z.string().optional(),
  budget_allocation: z.number().min(0).optional(),
  due_date: z.coerce.date().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  attachments: z.array(attachmentSchema).optional(),
  is_punch_item: z.boolean().optional(),
  approval: approvalSchema.optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  attachmentSchema,
  approvalSchema,
};
