const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const InvestmentSchema = new Schema({
    investor: {
        type: Schema.Types.ObjectId,
        ref: 'Investor',
        required: true
    },
    importOrder: {
        type: Schema.Types.ObjectId,
        ref: 'Import',
        required: true
    },
    shipmentId: {
        type: String, // String ID of the shipment within the Import order
        required: true
    },
    capitalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    totalShipmentCost: {
        type: Number,
        required: true,
        default: 0
    },
    profitSharePercentage: {
        type: Number,
        required: true,
        default: 50
    },
    contributionRatio: {
        type: Number, // capitalAmount / totalShipmentCost
        default: 1
    },
    status: {
        type: String,
        enum: ['Active', 'Closed'],
        default: 'Active'
    },
    payoutHistory: [{
        amount: Number,
        date: { type: Date, default: Date.now },
        note: String
    }],
    notes: String,
    updated: Date,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Investment', InvestmentSchema);
