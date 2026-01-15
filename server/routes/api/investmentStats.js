const express = require('express');
const router = express.Router();
const InvestorProfit = require('../../models/investorProfit');
const auth = require('../../middleware/auth');

// @route   GET api/investment-stats/:investorId
// @desc    Get aggregated profit stats for an investor
// @access  Private
router.get('/:investorId', auth, async (req, res) => {
    try {
        const investorId = new require('mongoose').Types.ObjectId(req.params.investorId);

        // 1. Realized Profit and Sales Stats
        const soldProductStats = await InvestorProfit.aggregate([
            { $match: { investor: investorId } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: { investment: "$investment", product: "$product" },
                    productName: { $first: "$productInfo.name" },
                    productShortName: { $first: "$productInfo.shortName" },
                    realizedProfit: { $sum: "$investorShare" },
                    quantitySold: { $sum: "$quantity" }
                }
            }
        ]);

        // 2. Potential Profit Calculation
        const InvestorStock = require('../../models/investorStock');
        const stocks = await InvestorStock.find({ investor: investorId })
            .populate('product', 'name shortName wholeSellPrice price')
            .populate('investment', 'contributionRatio profitSharePercentage');

        const productProjections = stocks.map(stock => {
            const soldStats = soldProductStats.find(s =>
                s._id.investment.toString() === stock.investment._id.toString() &&
                s._id.product.toString() === stock.product._id.toString()
            );

            let potentialProfit = 0;
            const unitsSold = stock.totalQuantity - stock.remainingQuantity;

            if (unitsSold === 0 || !soldStats) {
                const wholesalePrice = stock.product.wholeSellPrice || stock.product.price;
                const margin = wholesalePrice - stock.buyingPrice;
                potentialProfit = margin * stock.remainingQuantity * stock.investment.contributionRatio * (stock.investment.profitSharePercentage / 100);
            } else {
                const avgProfitPerUnit = soldStats.realizedProfit / soldStats.quantitySold;
                potentialProfit = avgProfitPerUnit * stock.remainingQuantity;
            }

            return {
                investmentId: stock.investment._id,
                productId: stock.product._id,
                productName: stock.product.name,
                productShortName: stock.product.shortName,
                potentialProfit,
                totalItems: stock.totalQuantity,
                remainingUnits: stock.remainingQuantity
            };
        });

        // 3. Investments & Payouts
        const investments = await require('../../models/investment').find({ investor: investorId }).populate('importOrder');
        const globalPayouts = await require('../../models/investorPayout').find({ investor: investorId });

        const totalCapital = investments.reduce((sum, inv) => sum + inv.capitalAmount, 0);
        let totalWithdrawn = globalPayouts.reduce((sum, p) => sum + p.amount, 0);

        const combinedStats = investments.map(inv => {
            const invIdStr = inv._id.toString();
            // Note: Per-shipment payouts are now migrating to global, but we include them if they exist for legacy
            const legacyWithdrawn = (inv.payoutHistory || []).reduce((sum, p) => sum + p.amount, 0);
            totalWithdrawn += legacyWithdrawn;

            const invProducts = [];
            soldProductStats.filter(s => s._id.investment.toString() === invIdStr).forEach(s => {
                const proj = productProjections.find(p => p.investmentId.toString() === invIdStr && p.productId.toString() === s._id.product.toString());
                invProducts.push({
                    productId: s._id.product,
                    name: s.productName,
                    shortName: s.productShortName,
                    quantitySold: s.quantitySold,
                    realizedProfit: s.realizedProfit,
                    remainingUnits: proj ? proj.remainingUnits : 0,
                    projectedProfit: proj ? proj.potentialProfit : 0
                });
            });

            productProjections.filter(p => p.investmentId.toString() === invIdStr).forEach(p => {
                const alreadyAdded = invProducts.find(ip => ip.productId.toString() === p.productId.toString());
                if (!alreadyAdded) {
                    invProducts.push({
                        productId: p.productId,
                        name: p.productName,
                        shortName: p.productShortName,
                        quantitySold: 0,
                        realizedProfit: 0,
                        remainingUnits: p.remainingUnits,
                        projectedProfit: p.potentialProfit
                    });
                }
            });

            const totals = invProducts.reduce((acc, curr) => ({
                realized: acc.realized + curr.realizedProfit,
                projected: acc.projected + curr.projectedProfit,
                sold: acc.sold + curr.quantitySold,
                remaining: acc.remaining + curr.remainingUnits
            }), { realized: 0, projected: 0, sold: 0, remaining: 0 });

            return {
                investmentId: inv._id,
                realizedProfit: totals.realized,
                quantitySold: totals.sold,
                projectedProfit: totals.projected,
                remainingUnits: totals.remaining,
                withdrawn: legacyWithdrawn,
                products: invProducts
            };
        });

        const totalRealized = combinedStats.reduce((sum, s) => sum + s.realizedProfit, 0);
        const totalProjected = combinedStats.reduce((sum, s) => sum + s.projectedProfit, 0);

        // 4. Build Ledger
        const ledger = [];

        // Add Investments
        investments.forEach(inv => {
            ledger.push({
                date: inv.created,
                type: 'Investment',
                ref: inv.shipmentId,
                amount: inv.capitalAmount,
                note: `Capital for ${inv.shipmentId}`
            });
        });

        // Add Profits (Grouped by Invoice for clarity)
        const detailedProfits = await InvestorProfit.find({ investor: investorId }).populate('product', 'name');
        detailedProfits.forEach(p => {
            ledger.push({
                date: p.created,
                type: 'Profit',
                ref: p.invoice ? `Inv #${p.invoice.toString().slice(-6)}` : 'Sale',
                amount: p.investorShare,
                note: `${p.product ? p.product.name : 'Product'} x ${p.quantity}`
            });
        });

        // Add Global Payouts
        globalPayouts.forEach(p => {
            ledger.push({
                date: p.date,
                type: 'Withdrawal',
                ref: 'Global',
                amount: -Math.abs(p.amount),
                note: p.note || 'Cash Withdrawal'
            });
        });

        // Add Legacy Shipments Payouts
        investments.forEach(inv => {
            (inv.payoutHistory || []).forEach(p => {
                ledger.push({
                    date: p.date,
                    type: 'Withdrawal',
                    ref: inv.shipmentId,
                    amount: -Math.abs(p.amount),
                    note: p.note || `Withdrawal from ${inv.shipmentId}`
                });
            });
        });

        // Sort ledger and calculate running balance
        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
        let runningBalance = 0;
        const ledgerWithBalance = ledger.map(entry => {
            runningBalance += entry.amount;
            return { ...entry, balance: runningBalance };
        });

        res.status(200).json({
            summary: {
                totalRealizedProfit: totalRealized,
                totalProjectedProfit: totalProjected,
                totalCapital,
                totalProfit: totalRealized + totalProjected,
                totalWithdrawn,
                totalWithdrawable: (totalCapital + totalRealized + totalProjected) - totalWithdrawn,
                totalWithdrawableProfit: Math.max(0, (totalRealized + totalProjected) - totalWithdrawn)
            },
            investments: combinedStats,
            ledger: ledgerWithBalance.reverse() // Newest first for UI
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(400).json({ error: 'Error fetching stats.' });
    }
});

module.exports = router;
