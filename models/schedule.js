const mongoose = require("mongoose");
const { Schema } = mongoose;
const SCHEDULE_STATUS = require("../config/scheduleStatus");

const ScheduleSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    client_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    manager_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    project_id: { type: Schema.Types.ObjectId, ref: "Project", required: true },

    date: { type: Date, required: true },
    time: { type: String, required: true }, // Format HH:MM
    event: { type: String, required: true },
    description: { type: String },

    status: {
      type: String,
      enum: Object.values(SCHEDULE_STATUS),
      default: SCHEDULE_STATUS.UPCOMING,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Schedule", ScheduleSchema);
