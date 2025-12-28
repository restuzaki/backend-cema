const { z } = require("zod");

/**
 * Zod Validation Schemas for Project Module
 *
 * Provides comprehensive validation for project creation and updates
 * with proper type checking, constraints, and error messages.
 */

// ========================================
// REUSABLE SUB-SCHEMAS
// ========================================

// Location schema (used in both projects and schedules)
const locationSchema = z.object({
  address: z.string().optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

// Financials schema
const financialsSchema = z.object({
  budget_total: z.number().min(0).optional(),
  cost_actual: z.number().min(0).optional(),
  value_planned: z.number().min(0).optional(),
  value_earned: z.number().min(0).optional(),
  cpi: z.number().optional(), // Cost Performance Index
  spi: z.number().optional(), // Schedule Performance Index
});

// Document schema
const documentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  url: z.url("Invalid document URL"),
  type: z.enum(["CONTRACT", "BLUEPRINT", "INVOICE"], {
    errorMap: () => ({
      message: "Document type must be CONTRACT, BLUEPRINT, or INVOICE",
    }),
  }),
  uploaded_at: z.coerce.date().optional(),
});

// ========================================
// CREATE PROJECT SCHEMA
// ========================================

const createProjectSchema = z.object({
  // Required fields
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Project name too long"),
  admin_id: z.string().min(1, "Admin ID is required"),
  client_id: z.string().min(1, "Client ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  manager_id: z.string().min(1, "Manager ID is required"),
  managerName: z.string().min(1, "Manager name is required"),
  serviceType: z.string().min(1, "Service type is required"),
  startDate: z.coerce.date({
    errorMap: () => ({
      message: "Start date is required and must be a valid date",
    }),
  }),

  // Optional fields
  description: z.string().optional(),
  team_members: z.array(z.string()).optional().default([]),
  status: z
    .enum([
      "LEAD",
      "DESIGN",
      "CONSTRUCTION",
      "RETENTION",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional()
    .default("LEAD"),
  location: locationSchema.optional(),
  endDate: z.coerce.date().optional(),
  financials: financialsSchema.optional(),
  documents: z.array(documentSchema).optional().default([]),
});

// ========================================
// UPDATE PROJECT SCHEMA
// ========================================

const updateProjectSchema = z.object({
  // All fields are optional for updates
  name: z.string().min(1, "Project name cannot be empty").max(200).optional(),
  description: z.string().optional(),
  clientName: z.string().min(1).optional(),
  managerName: z.string().min(1).optional(),
  team_members: z.array(z.string()).optional(),
  status: z
    .enum([
      "LEAD",
      "DESIGN",
      "CONSTRUCTION",
      "RETENTION",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  location: locationSchema.optional(),
  progress: z
    .number()
    .min(0, "Progress cannot be negative")
    .max(100, "Progress cannot exceed 100")
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  financials: financialsSchema.optional(),
  documents: z.array(documentSchema).optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  locationSchema,
  financialsSchema,
  documentSchema,
};
