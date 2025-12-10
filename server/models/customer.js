const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Customer Schema
const CustomerSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  purchase_history: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  ],
  payment_history: [
    {
      amount: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      },
      relatedInvoice: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice'
      },
      paymentMethod: {
        type: String,
        default: 'cash',
        enum: ['cash', 'bank', 'bkash', 'nagad']
      },
      notes: {
        type: String
      },
      createdBy: {
        type: String,
        default: 'Admin'
      }
    }
  ],
  due: {
    type: Number,
    default: 0
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Customer', CustomerSchema);
