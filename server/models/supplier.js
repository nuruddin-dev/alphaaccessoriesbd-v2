const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Supplier Schema
const SupplierSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String
    },
    address: {
        type: String
    },
    notes: {
        type: String
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

module.exports = Mongoose.model('Supplier', SupplierSchema);
