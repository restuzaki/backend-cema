const mongoose = require("mongoose");
const { Schema } = mongoose;

const TaskSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    project_id: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assigned_to: [{ type: Schema.Types.ObjectId, ref: "User" }],
    created_by: { type: Schema.Types.ObjectId, ref: "User" },

    title: { type: String, required: true },
    description: String,

    budget_allocation: { type: Number, default: 0 },
    due_date: Date,

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
      default: "TODO",
    },

    attachments: [
      {
        type: { type: String, enum: ["FILE", "IMAGE", "LINK"], required: true },
        url: { type: String, required: true },
        name: String,
        uploaded_at: { type: Date, default: Date.now },
      },
    ],

    is_punch_item: { type: Boolean, default: false },

    approval: {
      is_approved: { type: Boolean, default: false },
      approved_by: { type: Schema.Types.ObjectId, ref: "User" },
      rejection_note: String,
      approved_at: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
