const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Cargo Schema - stores shipping company information
const CargoSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactNumber: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Cargo', CargoSchema);
