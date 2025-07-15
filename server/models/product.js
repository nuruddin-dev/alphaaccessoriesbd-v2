const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

// Product Schema
const ProductSchema = new Schema({
  sku: {
    type: String
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  shortName: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  imageKey: {
    type: String
  },
  imageAlt: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  fullDescription: {
    type: String,
    trim: true
  },
  specification: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number
  },
  previousPrice: {
    type: Number
  },
  price: {
    type: Number
  },
  buyingPrice: {
    type: Number
  },
  wholeSellPrice: {
    type: Number
  },
  popular: {
    type: Boolean,
    default: false
  },
  premium: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  tags: {
    type: [Schema.Types.ObjectId],
    ref: 'Tag',
    default: []
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  colors: {
    type: [String],
    default: []
  },
  note: {
    type: String
  },
  history: [
    {
      updatedAt: {
        type: Date,
        default: Date.now // Timestamp of the update
      },
      updatedBy: {
        type: String // Reference to the user who made the update
      },
      changes: {
        type: Object, // Store the changes made during the update
        default: {}
      },
      note: {
        type: String // Optional note about the update
      }
    }
  ],
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Product', ProductSchema);
