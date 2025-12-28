const mongoose = require("mongoose");
const { Schema } = mongoose;
const APPROVAL_STATUS = require("../config/approvalStatus");

const TimeLogSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    project_id: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    manager_id: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Denormalized for performance
    task_id: { type: Schema.Types.ObjectId, ref: "Task" },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },

    start_at: { type: Date, required: true },
    end_at: { type: Date, required: true },
    duration_minutes: { type: Number, default: 0 }, // Auto-calculated in pre-save hook

    description: String,

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

// Pre-save hook: Auto-calculate duration_minutes
TimeLogSchema.pre("save", async function () {
  if (this.start_at && this.end_at) {
    const durationMs = this.end_at.getTime() - this.start_at.getTime();
    this.duration_minutes = Math.round(durationMs / (1000 * 60));
  }
});

module.exports = mongoose.model("TimeLog", TimeLogSchema);
