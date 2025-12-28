const { z } = require("zod");
const APPROVAL_STATUS = require("../config/approvalStatus");
const EXPENSE_CATEGORY = require("../config/expenseCategory");
const CURRENCY = require("../config/currency");

/**
 * Zod Validation Schemas for Expense Module
 *
 * Validates expense tracking entries with amount, currency, and category validation.
 */

// ========================================
// CREATE EXPENSE SCHEMA
// ========================================

const createExpenseSchema = z.object({
  // Required fields
  project_id: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  amount: z
    .number({
      errorMap: () => ({ message: "Amount must be a valid number" }),
    })
    .min(0, "Amount cannot be negative"),
  currency: z.enum([CURRENCY.IDR, CURRENCY.USD, CURRENCY.SGD], {
    errorMap: () => ({ message: "Currency must be IDR, USD, or SGD" }),
  }),
  category: z.enum(
    [
      EXPENSE_CATEGORY.TRANSPORTATION,
      EXPENSE_CATEGORY.MATERIAL,
      EXPENSE_CATEGORY.MEAL,
      EXPENSE_CATEGORY.OTHER,
    ],
    {
      errorMap: () => ({
        message: "Category must be TRANSPORTATION, MATERIAL, MEAL, or OTHER",
      }),
    }
  ),
  date: z.coerce.date({
    errorMap: () => ({ message: "Date must be a valid Date" }),
  }),

  // Optional fields
  receipt_url: z.string().url("Invalid receipt URL").optional(),
});

// ========================================
// UPDATE EXPENSE SCHEMA
// ========================================

const updateExpenseSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    amount: z.number().min(0).optional(),
    currency: z.enum([CURRENCY.IDR, CURRENCY.USD, CURRENCY.SGD]).optional(),
    category: z
      .enum([
        EXPENSE_CATEGORY.TRANSPORTATION,
        EXPENSE_CATEGORY.MATERIAL,
        EXPENSE_CATEGORY.MEAL,
        EXPENSE_CATEGORY.OTHER,
      ])
      .optional(),
    date: z.coerce.date().optional(),
    receipt_url: z.url().optional(),
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
  createExpenseSchema,
  updateExpenseSchema,
};
