const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },

    // Client Data
    clientId: { type: String, ref: 'User', required: true },
    clientName: { type: String, required: true },

    status: {
        type: String,
        enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
        default: 'planning',
        required: true
    },

    serviceType: {
        type: String,
        enum: ['interior', 'architecture', 'renovation', 'consultation'],
        required: true
    },

    progress: { type: Number, default: 0, min: 0, max: 100 },
    budget: { type: Number },

    startDate: { type: Date, required: true },
    endDate: { type: Date },

    projectManager: { type: String, ref: 'User' },
    teamMembers: [{ type: String, ref: 'User' }],

    location: {
        address: String,
        coordinates: { lat: Number, lng: Number }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);