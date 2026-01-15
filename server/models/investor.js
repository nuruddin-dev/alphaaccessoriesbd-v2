const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const InvestorSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    defaultProfitShare: {
        type: Number,
        default: 50 // Default 50% profit share
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: String,
    updated: Date,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Investor', InvestorSchema);
