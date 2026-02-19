const mongoose = require('mongoose');
const { Schema } = mongoose;

const schoolSchema = new Schema({
    _id: {
        type: String,
        default: () => require('nanoid').nanoid()
    },
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        match: /^\d{10,15}$/
    },
    email: {
        type: String,
        required: true,
        match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        unique: true  // Add unique constraint
    },
    adminId: {
        type: String,
        ref: 'User',
        required: true
    },
    totalStudents: {
        type: Number,
        default: 0
    },
    totalClassrooms: {
        type: Number,
        default: 0
    },
    academicYear: {
        type: String,
        required: true
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
}, { collection: 'schools' });

module.exports = mongoose.model('School', schoolSchema);
