const mongoose = require('mongoose');

const uri = 'mongodb+srv://nuruddinbjit:nuruddinbjit@cluster0.ybh4fiq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('Attempting to connect to MongoDB...');

const Product = require('./models/product');

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('Successfully connected to MongoDB!');
        try {
            console.log('Running popular query...');
            const popular = await Product.find({ isActive: true, popular: true })
                .limit(14)
                .sort('-created');
            console.log(`Found ${popular.length} popular products.`);

            console.log('Running premium query...');
            const premium = await Product.find({ isActive: true, premium: true })
                .limit(14)
                .sort('-created');
            console.log(`Found ${premium.length} premium products.`);

            console.log('Running newArrivals query...');
            const newArrivals = await Product.find({ isActive: true })
                .sort('-created')
                .limit(14);
            console.log(`Found ${newArrivals.length} new products.`);
        } catch (e) {
            console.error('Error counting:', e);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
