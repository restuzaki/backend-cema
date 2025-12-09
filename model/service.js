const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true }, 
    category: {
        type: String,
        enum: ["Design", "Konstruksi", "Renovasi"], 
        required: true,
    },
    price: { type: String, required: true },
    image: { type: String, required: true }, 
    description: { type: String, required: true },
    features: [{ type: String }], 
    isPopular: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);