const express = require('express');
const router = express.Router();
const Cargo = require('../../models/cargo');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route   GET api/cargo
// @desc    Get all cargos
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const cargos = await Cargo.find({ isActive: true }).sort('name');
        res.status(200).json({ cargos });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   GET api/cargo/:id
// @desc    Get cargo by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const cargo = await Cargo.findById(req.params.id);
        if (!cargo) {
            return res.status(404).json({ error: 'Cargo not found.' });
        }
        res.status(200).json({ cargo });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   POST api/cargo/add
// @desc    Create new cargo
// @access  Private (Admin only)
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, contactNumber, address, email, notes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Cargo name is required.' });
        }

        const cargo = new Cargo({
            name,
            contactNumber,
            address,
            email,
            notes
        });

        const savedCargo = await cargo.save();

        res.status(200).json({
            success: true,
            message: 'Cargo created successfully!',
            cargo: savedCargo
        });
    } catch (error) {
        console.error('Error creating cargo:', error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   PUT api/cargo/:id
// @desc    Update cargo
// @access  Private (Admin only)
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, contactNumber, address, email, notes, isActive } = req.body;

        const cargo = await Cargo.findById(req.params.id);
        if (!cargo) {
            return res.status(404).json({ error: 'Cargo not found.' });
        }

        if (name !== undefined) cargo.name = name;
        if (contactNumber !== undefined) cargo.contactNumber = contactNumber;
        if (address !== undefined) cargo.address = address;
        if (email !== undefined) cargo.email = email;
        if (notes !== undefined) cargo.notes = notes;
        if (isActive !== undefined) cargo.isActive = isActive;
        cargo.updated = new Date();

        await cargo.save();

        res.status(200).json({
            success: true,
            message: 'Cargo updated successfully!',
            cargo
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   DELETE api/cargo/:id
// @desc    Delete cargo (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const cargo = await Cargo.findById(req.params.id);
        if (!cargo) {
            return res.status(404).json({ error: 'Cargo not found.' });
        }

        cargo.isActive = false;
        cargo.updated = new Date();
        await cargo.save();

        res.status(200).json({
            success: true,
            message: 'Cargo deleted successfully!'
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

module.exports = router;
