const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Order Schema
const OrderSchema = new Schema({
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  total: {
    type: Number,
    default: 0
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  },
  phoneNumber: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryCharge: {
    type: Number,
    default: 0
  }
});

module.exports = Mongoose.model('Order', OrderSchema);
