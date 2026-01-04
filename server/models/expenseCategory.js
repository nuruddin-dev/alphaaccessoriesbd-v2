const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Expense Category Schema
const ExpenseCategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
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

module.exports = Mongoose.model('ExpenseCategory', ExpenseCategorySchema);
