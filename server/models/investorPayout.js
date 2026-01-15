const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const InvestorPayoutSchema = new Schema({
    investor: {
        type: Schema.Types.ObjectId,
        ref: 'Investor',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['Profit', 'Capital', 'Combined'],
        default: 'Combined'
    },
    note: String,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('InvestorPayout', InvestorPayoutSchema);
