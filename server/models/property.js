const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Property Schema (Shop/Godown)
const PropertySchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    type: {
        type: String,
        enum: ['shop', 'godown'],
        default: 'shop'
    },
    rent: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    noteHistory: [
        {
            note: String,
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
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

module.exports = Mongoose.model('Property', PropertySchema);
