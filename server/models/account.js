const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Account Schema for Company Accounts (Bank, Mobile, Cash)
const AccountSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['bank', 'mobile', 'cash', 'other'],
        default: 'bank'
    },
    details: {
        type: String // Extra info like Account Number, Branch
    },
    balance: {
        type: Number,
        default: 0
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

module.exports = Mongoose.model('Account', AccountSchema);
