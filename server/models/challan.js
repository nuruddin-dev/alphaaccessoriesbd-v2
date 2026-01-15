const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Challan (Delivery Note) Schema
// Tracks products sent out as samples/lending/debt without a final sale invoice.
const ChallanSchema = new Schema({
    challanNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customerName: {
        type: String,
        set: v => v ? v.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : v
    },
    customerPhone: {
        type: String
    },
    customerAddress: {
        type: String
    },
    items: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            productName: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            // Optional: Price tracking for reference, even if not billed yet
            unitPrice: {
                type: Number,
                default: 0
            },
            buyingPrice: {
                type: Number,
                default: 0
            },
            totalPrice: {
                type: Number,
                default: 0
            },
            returnedQuantity: {
                type: Number,
                default: 0
            },
            billedQuantity: {
                type: Number,
                default: 0
            }
        }
    ],
    status: {
        type: String,
        enum: ['Sent', 'Returned', 'Converted'],
        default: 'Sent'
    },
    notes: {
        type: String
    },
    createdBy: {
        type: String,
        required: true
    },
    updated: Date,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Challan', ChallanSchema);
