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
  purchase_history: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Invoice'
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
