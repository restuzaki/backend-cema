const mongoose = require("mongoose");
const { Schema } = mongoose;
const DESIGN_STYLES = require("../config/designStyles");

const QuizQuestionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    text: { type: String, required: true },
    imageUrl: { type: String },
    relatedStyle: {
      type: String,
      enum: Object.values(DESIGN_STYLES),
      required: true,
    },
    // Optional: Add weight/score if needed later
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizQuestion", QuizQuestionSchema);
