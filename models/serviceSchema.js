const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true }, 
    category: {
        type: String,
        enum: ["DESIGN", "KONSTRUKSI", "RENOVASI"], 
        required: true,
    },
    price: { type: String, required: true },
    image: { type: String, required: false }, 
    description: { type: String, required: true },
    features: [{ type: String }], 
    isPopular: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("ServiceSchema", serviceSchema);