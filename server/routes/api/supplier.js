const express = require('express');
const router = express.Router();
const Supplier = require('../../models/supplier');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route   GET api/supplier
// @desc    Get all suppliers
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const suppliers = await Supplier.find({ isActive: true }).sort('name');
        res.status(200).json({ suppliers });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   GET api/supplier/:id
// @desc    Get supplier by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const supplierId = req.params.id;
        const supplier = await Supplier.findOne({ _id: supplierId, isActive: true });

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }

        res.status(200).json({ supplier });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   POST api/supplier/add
// @desc    Add supplier
// @access  Private
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, phoneNumber, address, notes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'You must enter a name.' });
        }

        const supplier = new Supplier({
            name,
            phoneNumber,
            address,
            notes
        });

        const savedSupplier = await supplier.save();

        res.status(200).json({
            success: true,
            message: 'Supplier has been added successfully!',
            supplier: savedSupplier
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   PUT api/supplier/update/:id
// @desc    Update supplier
// @access  Private
router.put('/update/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const supplierId = req.params.id;
        const update = req.body;
        const query = { _id: supplierId };

        const supplier = await Supplier.findOneAndUpdate(query, update, {
            new: true
        });

        res.status(200).json({
            success: true,
            message: 'Supplier has been updated successfully!',
            supplier
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

module.exports = router;
