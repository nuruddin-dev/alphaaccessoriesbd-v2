const mongoose = require('mongoose');
try { require('dotenv').config(); } catch(e) {}

const productName = 'K28 Selfie Stick';
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/alphaaccessoriesbd-v2'; 

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  const Schema = mongoose.Schema;
  const ProductSchema = new Schema({
    name: String,
    shortName: String,
    buyingPrice: Number
  });
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

  const products = await Product.find({
    $or: [
      { name: productName },
      { shortName: productName }
    ]
  });
  
  console.log('Products found:', products.length);
  products.forEach(p => {
    console.log(JSON.stringify(p, null, 2));
  });
  
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
