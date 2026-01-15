const express = require('express');
const router = express.Router();
const Investment = require('../../models/investment');
const ImportOrder = require('../../models/import');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route   POST api/investment/add
// @desc    Link an investor to a shipment
// @access  Private (Admin)
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { investorId, importOrderId, shipmentId, capitalAmount, totalShipmentCost, profitSharePercentage } = req.body;

        const contributionRatio = capitalAmount / totalShipmentCost;

        const investment = new Investment({
            investor: investorId,
            importOrder: importOrderId,
            shipmentId,
            capitalAmount,
            totalShipmentCost,
            profitSharePercentage,
            contributionRatio
        });

        await investment.save();

        res.status(200).json({
            success: true,
            message: 'Investment recorded successfully!',
            investment
        });
    } catch (error) {
        res.status(400).json({ error: 'Error recording investment.' });
    }
});

// @route   GET api/investment/investor/:investorId
// @desc    Get all investments for a specific investor
// @access  Private
router.get('/investor/:investorId', auth, async (req, res) => {
    try {
        const investments = await Investment.find({ investor: req.params.investorId })
            .populate({
                path: 'importOrder',
                populate: { path: 'supplier', select: 'name' }
            })
            .sort('-created');
        res.status(200).json({ investments });
    } catch (error) {
        res.status(400).json({ error: 'Error fetching investments.' });
    }
});

// @route   POST api/investment/payout/:id
// @desc    Record a payout/withdrawal for an investment
// @access  Private (Admin)
router.post('/payout/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { amount, note } = req.body;
        const investment = await Investment.findById(req.params.id);

        if (!investment) return res.status(404).json({ error: 'Investment not found.' });

        investment.payoutHistory.push({
            amount,
            note,
            date: new Date()
        });

        await investment.save();
        res.status(200).json({ success: true, message: 'Payout recorded successfully!' });
    } catch (error) {
        res.status(400).json({ error: 'Error recording payout.' });
    }
});

// @route   POST api/investment/payout-global/:investorId
// @desc    Record a global payout/withdrawal for an investor
// @access  Private (Admin)
router.post('/payout-global/:investorId', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { amount, note } = req.body;
        const InvestorPayout = require('../../models/investorPayout');

        const payout = new InvestorPayout({
            investor: req.params.investorId,
            amount: parseFloat(amount),
            note,
            date: new Date()
        });

        await payout.save();
        res.status(200).json({ success: true, message: 'Global payout recorded successfully!' });
    } catch (error) {
        console.error('Payout Error:', error);
        res.status(400).json({ error: 'Error recording global payout.' });
    }
});

// @route   GET api/investment
// @desc    Get all investments (for mapping to shipments)
// @access  Private (Admin)
router.get('/', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const investments = await Investment.find()
            .populate('investor', 'name')
            .select('shipmentId investor capitalAmount');
        res.status(200).json({ investments });
    } catch (error) {
        res.status(400).json({ error: 'Error fetching investments.' });
    }
});

module.exports = router;
