const mongoose = require("mongoose");
const { Schema } = mongoose;
const APPROVAL_STATUS = require("../config/approvalStatus");
const EXPENSE_CATEGORY = require("../config/expenseCategory");
const CURRENCY = require("../config/currency");

const ExpenseSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    project_id: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    manager_id: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Denormalized for performance
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true },
    amount: {
      type: Number,
      required: true,
      min: 0,
      set: (value) => Math.round(value * 100) / 100, // Round to 2 decimal places
    },

    currency: {
      type: String,
      enum: Object.values(CURRENCY),
      required: true,
      default: CURRENCY.IDR,
    },

    category: {
      type: String,
      enum: Object.values(EXPENSE_CATEGORY),
      required: true,
    },

    date: { type: Date, required: true },
    receipt_url: String,

    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
    },

    rejection_note: String,
    approved_by: { type: Schema.Types.ObjectId, ref: "User" },
    approved_at: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
