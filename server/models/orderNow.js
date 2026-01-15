const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants');

const orderNowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    set: v => v ? v.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : v
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: ORDER_STATUS.Pending,
    enum: [
      ORDER_STATUS.Pending,
      ORDER_STATUS.OnHold,
      ORDER_STATUS.Ordered,
      ORDER_STATUS.Shipped,
      ORDER_STATUS.Delivered,
      ORDER_STATUS.Canceled,
      ORDER_STATUS.Spam
    ]
  },
  note: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('OrderNow', orderNowSchema);
