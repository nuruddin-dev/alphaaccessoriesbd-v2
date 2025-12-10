const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Invoice Schema
const InvoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  isWholeSale: {
    type: Boolean,
    default: true
  },
  customerName: {
    type: String
  },
  customerPhone: {
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
      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },
      buyingPrice: {
        type: Number,
        default: 0
      },
      totalPrice: {
        type: Number,
        required: true
      }
    }
  ],
  subTotal: {
    type: Number,
    required: true
  },
  previousDue: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },
  paid: {
    type: Number,
    default: 0,
    min: 0
  },
  due: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'bkash', 'nagad'],
    default: 'cash'
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

module.exports = Mongoose.model('Invoice', InvoiceSchema);
