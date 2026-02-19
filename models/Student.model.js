const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentSchema = new Schema({
    _id: {
        type: String,
        default: () => require('nanoid').nanoid()
    },
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    schoolId: {
        type: String,
        ref: 'School',
        required: true
    },
    classroomId: {
        type: String,
        ref: 'Classroom',
        required: true
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    rollNumber: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    parentName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    parentPhone: {
        type: String,
        required: true,
        match: /^\d{10,15}$/
    },
    parentEmail: {
        type: String,
        required: true,
        match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    },
    address: {
        type: String,
        required: true
    },
    admissionNumber: {
        type: String,
        required: true,
        unique: true
    },
    admissionDate: {
        type: Date,
        default: () => new Date()
    },
    academicYear: {
        type: String,
        required: true
    },
    attendance: {
        present: {
            type: Number,
            default: 0
        },
        absent: {
            type: Number,
            default: 0
        },
        leave: {
            type: Number,
            default: 0
        }
    },
    marks: [{
        subject: String,
        score: Number,
        date: Date
    }],
    enrollmentStatus: {
        type: String,
        enum: ['active', 'transferred', 'graduated', 'dropped'],
        default: 'active'
    },
    transferHistory: [{
        fromClassroom: String,
        toClassroom: String,
        transferDate: Date,
        reason: String
    }],
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
}, { collection: 'students' });

// Index for efficient querying
studentSchema.index({ schoolId: 1, classroomId: 1 });
studentSchema.index({ admissionNumber: 1 });
studentSchema.index({ rollNumber: 1, classroomId: 1 });

module.exports = mongoose.model('Student', studentSchema);
