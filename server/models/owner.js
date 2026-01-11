const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Owner Schema
const OwnerSchema = new Schema({
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
    notes: {
        type: String,
        trim: true
    },
    updated: Date,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Owner', OwnerSchema);
