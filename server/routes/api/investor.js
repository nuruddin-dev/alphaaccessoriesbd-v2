const express = require('express');
const router = express.Router();
const Investor = require('../../models/investor');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route   GET api/investor
// @desc    Get all active investors
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const investors = await Investor.find({ isActive: true }).sort('name');
        res.status(200).json({ investors });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route   GET api/investor/:id
// @desc    Get investor by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const investor = await Investor.findById(req.params.id);
        if (!investor) return res.status(404).json({ error: 'Investor not found.' });
        res.status(200).json({ investor });
    } catch (error) {
        res.status(400).json({ error: 'Error fetching investor.' });
    }
});

// @route   POST api/investor/add
// @desc    Add new investor
// @access  Private (Admin)
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, phoneNumber, email, address, defaultProfitShare, notes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required.' });
        }

        const investor = new Investor({
            name,
            phoneNumber,
            email,
            address,
            defaultProfitShare,
            notes
        });

        const savedInvestor = await investor.save();
        res.status(200).json({
            success: true,
            message: 'Investor added successfully!',
            investor: savedInvestor
        });
    } catch (error) {
        res.status(400).json({ error: 'Error adding investor.' });
    }
});

// @route   PUT api/investor/:id
// @desc    Update investor profile
// @access  Private (Admin)
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const updates = req.body;
        updates.updated = new Date();

        const investor = await Investor.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!investor) return res.status(404).json({ error: 'Investor not found.' });

        res.status(200).json({
            success: true,
            message: 'Investor updated!',
            investor
        });
    } catch (error) {
        res.status(400).json({ error: 'Error updating investor.' });
    }
});

module.exports = router;
