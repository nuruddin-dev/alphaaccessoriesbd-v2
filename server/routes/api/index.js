const router = require('express').Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const customerRoutes = require('./customer');
const invoiceRoutes = require('./invoice');
const addressRoutes = require('./address');
const newsletterRoutes = require('./newsletter');
const productRoutes = require('./product');
const categoryRoutes = require('./category');
const brandRoutes = require('./brand');
const tagRoutes = require('./tag');
const contactRoutes = require('./contact');
const merchantRoutes = require('./merchant');
const cartRoutes = require('./cart');
const orderRoutes = require('./order');
const orderNowRoutes = require('./orderNow');
const reviewRoutes = require('./review');
const wishlistRoutes = require('./wishlist');
const sitemapRoutes = require('./sitemap'); // Import the sitemap route
const challanRoutes = require('./challan');

// auth routes
router.use('/auth', authRoutes);

// user routes
router.use('/user', userRoutes);

// customer routes
router.use('/customer', customerRoutes);

// invoice routes
router.use('/invoice', invoiceRoutes);

// address routes
router.use('/address', addressRoutes);

// newsletter routes
router.use('/newsletter', newsletterRoutes);

// product routes
router.use('/product', productRoutes);

// category routes
router.use('/category', categoryRoutes);

// brand routes
router.use('/brand', brandRoutes);

// tag routes
router.use('/tag', tagRoutes);

// contact routes
router.use('/contact', contactRoutes);

// merchant routes
router.use('/merchant', merchantRoutes);

// cart routes
router.use('/cart', cartRoutes);

// order routes
router.use('/order', orderRoutes);

// orderNow routes
router.use('/orderNow', orderNowRoutes);

// Review routes
router.use('/review', reviewRoutes);

// Wishlist routes
router.use('/wishlist', wishlistRoutes);

// Import routes
const importRoutes = require('./import');
router.use('/import', importRoutes);

// Supplier routes
const supplierRoutes = require('./supplier');
router.use('/supplier', supplierRoutes);

// Sitemap route
router.use('/', sitemapRoutes);

// Dashboard routes
const dashboardRoutes = require('./dashboard');
router.use('/dashboard', dashboardRoutes);

// Payment routes
const paymentRoutes = require('./payment');
router.use('/payment', paymentRoutes);

// Account routes
// Account routes
const accountRoutes = require('./account');
router.use('/account', accountRoutes);

// Challan routes
router.use('/challan', challanRoutes);

// MyShop Management routes
const myshopManagementRoutes = require('./myshop');
router.use('/myshop-mgmt', myshopManagementRoutes);

// Cargo routes
const cargoRoutes = require('./cargo');
router.use('/cargo', cargoRoutes);

// Investor and Investment routes
const investorRoutes = require('./investor');
const investmentRoutes = require('./investment');
const investmentStatsRoutes = require('./investmentStats');
const steadfastRoutes = require('./steadfast');
router.use('/investor', investorRoutes);
router.use('/investment', investmentRoutes);
router.use('/investment-stats', investmentStatsRoutes);
router.use('/steadfast', steadfastRoutes);


module.exports = router;
