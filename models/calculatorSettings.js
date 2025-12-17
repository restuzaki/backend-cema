const mongoose = require("mongoose");
const { Schema } = mongoose;

const CalculatorSettingsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true }, // Singleton ID e.g., 'CALC-SETTINGS'
    basePrice: { type: Number, required: true, default: 0 },
    areaMultiplier: { type: Number, required: true, default: 1 },
    floorMultiplier: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalculatorSettings", CalculatorSettingsSchema);
