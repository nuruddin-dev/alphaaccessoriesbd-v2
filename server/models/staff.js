const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Staff Schema
const StaffSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    salary: {
        type: Number,
        default: 0
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    updated: Date,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Staff', StaffSchema);
