const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Import Schema
const ImportSchema = new Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    supplier: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Draft', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Draft'
    },
    notes: String,

    // Product Items (Master list of ordered items)
    items: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        modelName: String,
        shortName: String, // Product short name for display
        quantityPerCtn: { type: Number, default: 0 },
        ctn: { type: Number, default: 0 },
        totalQuantity: { type: Number, default: 0 },

        priceRMB: { type: Number, default: 0 },
        priceBDT: { type: Number, default: 0 }, // Calculated buying price in BDT
        totalAmountRMB: { type: Number, default: 0 },
        totalAmountBDT: { type: Number, default: 0 },

        perCtnWeight: { type: Number, default: 0 },
        totalCtnWeight: { type: Number, default: 0 },
    }],

    // Global Costing Factors
    costs: {
        rmbRate: { type: Number, default: 0 },
        taxType: { type: String, enum: ['per_item', 'per_ctn', 'total', 'per_kg'], default: 'total' },
        taxValue: { type: Number, default: 0 },
        labourBillPerCtn: { type: Number, default: 0 },
        totalOrderValueBDT: { type: Number, default: 0 }
    },

    // Payment History
    payments: [{
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: String,
        note: String
    }],

    // Shipments / Consignments with unique shipment IDs
    shipments: [{
        shipmentId: { type: String }, // Unique shipment identifier e.g., "SHP-20231228-001"
        shipmentDate: Date,
        receivedDate: Date,
        status: {
            type: String,
            enum: ['Pending', 'Shipped', 'Received'],
            default: 'Pending'
        },
        isCompleted: { type: Boolean, default: false },
        note: String,
        items: [{
            product: { type: Schema.Types.ObjectId, ref: 'Product' },
            modelName: String,
            shortName: String,
            quantityPerCtn: { type: Number, default: 0 },
            ctn: { type: Number, default: 0 },
            quantity: { type: Number, default: 0 },
            perCtnWeight: { type: Number, default: 0 },
            priceRMB: { type: Number, default: 0 },
            priceBDT: { type: Number, default: 0 },
            totalPriceRMB: { type: Number, default: 0 },
            totalPriceBDT: { type: Number, default: 0 }
        }]
    }],

    updated: Date,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('Import', ImportSchema);
