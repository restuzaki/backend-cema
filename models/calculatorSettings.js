const mongoose = require("mongoose");
const { Schema } = mongoose;

const CalculatorSettingsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true }, // Singleton ID e.g., 'CALC-SETTINGS'
    areaMultiplier: { type: Number, required: true, default: 1 },
    pricePerRoom: { type: Number, required: true, default: 0 },
    materials: {
      standard: { type: Number, required: true, default: 0 },
      premium: { type: Number, required: true, default: 0 },
      luxury: { type: Number, required: true, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalculatorSettings", CalculatorSettingsSchema);
