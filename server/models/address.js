const Mongoose = require('mongoose');
const { Schema } = Mongoose;

// Address Schema
const AddressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  address: {
    type: String
  },
  district: {
    type: String
  },
  subDistrict: {
    type: String
  },
  // city: {
  //   type: String
  // },
  // state: {
  //   type: String
  // },
  // country: {
  //   type: String
  // },
  // zipCode: {
  //   type: String
  // },
  isDefault: {
    type: Boolean,
    default: null
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Address', AddressSchema);
