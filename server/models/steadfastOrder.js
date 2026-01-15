const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const SteadfastOrderSchema = new Schema({
    invoice: {
        type: String,
        required: true,
        unique: true
    },
    courier: {
        type: String,
        enum: ['steadfast', 'pathao', 'redx'],
        default: 'steadfast'
    },
    consignmentId: {
        type: String
    },
    trackingCode: {
        type: String
    },
    recipientName: {
        type: String,
        required: true
    },
    recipientPhone: {
        type: String,
        required: true
    },
    recipientAddress: {
        type: String,
        required: true
    },
    codAmount: {
        type: Number,
        default: 0
    },
    advanceAmount: {
        type: Number,
        default: 0
    },
    advanceAccount: {
        type: Schema.Types.ObjectId,
        ref: 'Account'
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    packagingCharge: {
        type: Number,
        default: 20
    },
    productCost: {
        type: Number,
        default: 0
    },
    codCharge: {
        type: Number,
        default: 0
    },
    profit: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: 'in_review'
    },
    note: String,
    itemDescription: String,
    items: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number,
        price: Number,
        buyingPrice: Number
    }],
    created: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        default: 'Admin'
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('SteadfastOrder', SteadfastOrderSchema);
