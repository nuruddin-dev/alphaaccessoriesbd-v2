const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Transaction Schema for Company Account Ledger
const TransactionSchema = new Schema({
    account: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String
    },
    referenceId: {
        type: Schema.Types.ObjectId // Invoice ID or Payment ID
    },
    description: {
        type: String
    },
    category: {
        type: String // e.g., 'Snacks', 'Paper', 'Others'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Transaction', TransactionSchema);
