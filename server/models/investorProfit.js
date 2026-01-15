const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Records individual profit entries earned from sales
const InvestorProfitSchema = new Schema({
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
    invoice: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalProfit: {
        type: Number, // (SalePrice - BuyingPrice) * Quantity
        required: true
    },
    investorShare: {
        type: Number, // totalProfit * contributionRatio * profitSharePercentage%
        required: true
    },
    salePrice: Number,
    buyingPrice: Number,
    contributionRatio: Number,
    profitSharePercentage: Number,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('InvestorProfit', InvestorProfitSchema);
