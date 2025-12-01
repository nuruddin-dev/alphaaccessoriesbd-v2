const express = require('express');
const router = express.Router();
const Invoice = require('../../models/invoice');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route GET api/dashboard/myshop
// @desc Get dashboard insights (sales, profit, warnings)
// @access Private (Admin only)
router.get('/myshop', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required.' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Fetch Invoices
        const invoices = await Invoice.find({
            created: { $gte: start, $lte: end }
        }).sort({ created: -1 });

        // Fetch all products to get buying prices
        // Optimization: We could fetch only products mentioned in the invoices, 
        // but fetching all might be faster than extracting thousands of names if the product catalog isn't huge.
        // Let's try to fetch all for now.
        const products = await Product.find({}, 'name shortName buyingPrice');

        // Create a map for quick product lookup
        const productMap = {};
        products.forEach(p => {
            if (p.name) productMap[p.name.trim().toLowerCase()] = p.buyingPrice || 0;
            if (p.shortName) productMap[p.shortName.trim().toLowerCase()] = p.buyingPrice || 0;
        });

        let totalSell = 0;
        let totalProfit = 0;
        let totalDiscount = 0;
        const invoiceInsights = [];
        const warnings = [];

        invoices.forEach(invoice => {
            let invoiceProfit = 0;
            let hasMissingBuyingPrice = false;
            let hasZeroBuyingPrice = false;

            invoice.items.forEach(item => {
                const productName = item.productName.trim().toLowerCase();
                const buyingPrice = productMap[productName];

                if (buyingPrice === undefined) {
                    hasMissingBuyingPrice = true;
                    // Warning: Product not found or buying price missing
                    warnings.push({
                        type: 'missing_product',
                        message: `Product "${item.productName}" in Invoice #${invoice.invoiceNumber} not found in database or has no buying price.`,
                        invoiceNumber: invoice.invoiceNumber,
                        productName: item.productName
                    });
                } else if (buyingPrice === 0) {
                    hasZeroBuyingPrice = true;
                    warnings.push({
                        type: 'zero_buying_price',
                        message: `Product "${item.productName}" in Invoice #${invoice.invoiceNumber} has 0 buying price.`,
                        invoiceNumber: invoice.invoiceNumber,
                        productName: item.productName
                    });
                }

                const bp = buyingPrice || 0;
                const itemProfit = (item.unitPrice - bp) * item.quantity;
                invoiceProfit += itemProfit;
            });

            // Subtract discount from profit
            invoiceProfit -= (invoice.discount || 0);

            // Add to totals
            totalSell += invoice.subTotal;
            totalProfit += invoiceProfit;
            totalDiscount += (invoice.discount || 0);

            if (invoiceProfit < 0) {
                warnings.push({
                    type: 'negative_profit',
                    message: `Invoice #${invoice.invoiceNumber} has negative profit (${invoiceProfit}).`,
                    invoiceNumber: invoice.invoiceNumber
                });
            }

            invoiceInsights.push({
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.customerName || '',
                totalSell: invoice.subTotal,
                totalProfit: invoiceProfit,
                date: invoice.created
            });
        });

        res.status(200).json({
            totalSell,
            totalProfit,
            totalDiscount,
            invoiceInsights,
            warnings
        });

    } catch (error) {
        console.error('Error fetching dashboard insights:', error);
        res.status(400).json({
            error: 'Your request could not be processed. Please try again.'
        });
    }
});

module.exports = router;
