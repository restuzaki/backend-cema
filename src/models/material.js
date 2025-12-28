const mongoose = require("mongoose");
const { Schema } = mongoose;

const MaterialSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    priceMultiplier: { type: Number, required: true, default: 1.0 },
    unit: { type: String, default: "m2" }, // Optional helpful field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", MaterialSchema);
