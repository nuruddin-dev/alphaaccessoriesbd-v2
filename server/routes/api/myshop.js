const express = require('express');
const router = express.Router();
const Staff = require('../../models/staff');
const Owner = require('../../models/owner');
const Property = require('../../models/property');
const MyShopTransaction = require('../../models/myShopTransaction');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// --- Staff Routes ---
router.get('/staff', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const staff = await Staff.find().sort({ name: 1 });
        res.status(200).json({ staff });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

router.post('/staff', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, phone, salary, joinedDate, notes } = req.body;
        const staff = new Staff({ name, phone, salary, joinedDate, notes });
        const savedStaff = await staff.save();
        res.status(200).json({ success: true, staff: savedStaff });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

router.put('/staff/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const update = req.body;
        update.updated = Date.now();
        const staff = await Staff.findByIdAndUpdate(req.params.id, update, { new: true });
        res.status(200).json({ success: true, staff });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// --- Owner Routes ---
router.get('/owner', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const owners = await Owner.find().sort({ name: 1 });
        res.status(200).json({ owners });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

router.post('/owner', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, phone, salary, notes } = req.body;
        const owner = new Owner({ name, phone, salary, notes });
        const savedOwner = await owner.save();
        res.status(200).json({ success: true, owner: savedOwner });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// --- Property Routes (Shop/Godown) ---
router.get('/property', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const properties = await Property.find().sort({ name: 1 });
        res.status(200).json({ properties });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

router.post('/property', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, type, rent, location, notes } = req.body;
        const property = new Property({ name, type, rent, location, notes });
        const savedProperty = await property.save();
        res.status(200).json({ success: true, property: savedProperty });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

router.post('/property/:id/note', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { note } = req.body;
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ error: 'Property not found.' });

        property.noteHistory.push({ note, date: Date.now() });
        await property.save();
        res.status(200).json({ success: true, property });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// --- Transaction Routes ---
router.get('/transactions', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { type, staff, owner, property, startDate, endDate } = req.query;
        const query = {};
        if (type) query.type = type;
        if (staff) query.staff = staff;
        if (owner) query.owner = owner;
        if (property) query.property = property;
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const transactions = await MyShopTransaction.find(query)
            .populate('staff', 'name')
            .populate('owner', 'name')
            .populate('property', 'name')
            .sort({ date: -1 });
        res.status(200).json({ transactions });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

router.post('/transactions', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { type, staff, owner, property, amount, date, description } = req.body;
        const transaction = new MyShopTransaction({
            type,
            staff,
            owner,
            property,
            amount,
            date,
            description
        });
        const savedTransaction = await transaction.save();
        res.status(200).json({ success: true, transaction: savedTransaction });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

router.delete('/transactions/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        await MyShopTransaction.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

module.exports = router;
