const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Tracks remaining quantities of a specific product from an investor-funded shipment
const InvestorStockSchema = new Schema({
    investor: {
        type: Schema.Types.ObjectId,
        ref: 'Investor',
        required: true
    },
    investment: {
        type: Schema.Types.ObjectId,
        ref: 'Investment',
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    shipmentId: {
        type: String,
        required: true
    },
    totalQuantity: {
        type: Number,
        required: true
    },
    remainingQuantity: {
        type: Number,
        required: true
    },
    buyingPrice: {
        type: Number, // Landing cost at the time of import
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('InvestorStock', InvestorStockSchema);
