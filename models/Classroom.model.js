const mongoose = require('mongoose');
const { Schema } = mongoose;

const classroomSchema = new Schema({
    _id: {
        type: String,
        default: () => require('nanoid').nanoid()
    },
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    grade: {
        type: String,
        required: true,
        enum: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    section: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 2,
        enum: ['A', 'B', 'C', 'D', 'E', 'F']
    },
    schoolId: {
        type: String,
        ref: 'School',
        required: true
    },
    teacherId: {
        type: String,
        default: null
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    currentEnrollment: {
        type: Number,
        default: 0
    },
    room: {
        type: String,
        required: true,
        maxlength: 20
    },
    academicYear: {
        type: String,
        required: true
    },
    resources: [{
        name: String,
        quantity: Number,
        condition: {
            type: String,
            enum: ['good', 'fair', 'poor'],
            default: 'good'
        }
    }],
    schedule: {
        startTime: String,
        endTime: String,
        days: [String]
    },
    maxCapacityReached: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    updatedAt: {
        type: Date,
        default: () => new Date()
    }
}, { collection: 'classrooms' });

// Update maxCapacityReached based on enrollment
classroomSchema.pre('save', function(next) {
    this.maxCapacityReached = this.currentEnrollment >= this.capacity;
    next();
});

module.exports = mongoose.model('Classroom', classroomSchema);
