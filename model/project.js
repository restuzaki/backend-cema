const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'], // Common defaults, adjustable
        default: 'Not Started'
    },
    serviceType: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    progress: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    budget: {
        type: Number
    },
    description: {
        type: String
    }
}, {
    timestamps: true // Handles createdAt and updatedAt
});

module.exports = mongoose.model('Project', projectSchema);