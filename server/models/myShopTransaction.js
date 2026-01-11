const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// MyShopTransaction Schema (Salaries, Rents, Special Costs, Landings)
const MyShopTransactionSchema = new Schema({
    type: {
        type: String,
        enum: [
            'staff_salary',
            'staff_landing',
            'owner_salary',
            'owner_landing',
            'owner_deposit',
            'owner_withdraw',
            'shop_rent',
            'godown_rent',
            'special_cost',
            'property_note'
        ],
        required: true
    },
    staff: {
        type: Schema.Types.ObjectId,
        ref: 'Staff'
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Owner'
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property'
    },
    amount: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('MyShopTransaction', MyShopTransactionSchema);
