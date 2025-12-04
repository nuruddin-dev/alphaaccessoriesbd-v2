const mongoose = require('mongoose');
// Hardcode URI if dotenv fails or just try to load it
try { require('dotenv').config(); } catch(e) {}

const invoiceNumber = '1764754365231';
// Assuming local mongo if env missing, but usually it's in .env
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/alphaaccessoriesbd-v2'; 

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  const Schema = mongoose.Schema;
  
  const ProductSchema = new Schema({
    buyingPrice: Number
  });
  // Use existing model if already compiled (unlikely in script) or compile
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

  const InvoiceSchema = new Schema({
    invoiceNumber: String,
    items: [{
      product: { type: Schema.Types.ObjectId, ref: 'Product' },
      buyingPrice: Number
    }]
  });
  const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

  const invoice = await Invoice.findOne({ invoiceNumber });
  
  if (!invoice) {
    console.log('Invoice not found');
  } else {
    console.log('Invoice found:', invoice._id);
    console.log('Items:', JSON.stringify(invoice.items, null, 2));
    
    for (const item of invoice.items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          console.log(`Product ${item.product} found. Buying Price: ${product.buyingPrice}`);
        } else {
          console.log(`Product ${item.product} NOT found`);
        }
      } else {
        console.log('Item has no product reference');
      }
    }
  }
  
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
