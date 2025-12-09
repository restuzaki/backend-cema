const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    projectId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        required: true,
        enum: ['To Do', 'In Progress', 'Done', 'Blocked'],
        default: 'To Do'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    assignedTo: {
        type: String
    },
    dueDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
