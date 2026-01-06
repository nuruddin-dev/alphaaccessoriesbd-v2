const express = require('express');
const router = express.Router();
const Challan = require('../../models/challan');
const Product = require('../../models/product');
const Customer = require('../../models/customer');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route GET api/challan
// @desc Get all challans
// @access Private
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const query = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.created = { $gte: start, $lte: end };
        }

        if (status) {
            query.status = status;
        }

        const challans = await Challan.find(query)
            .populate('customer', 'name phoneNumber')
            .sort({ created: -1 });

        res.status(200).json({ challans });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route GET api/challan/:id
// @desc Get challan by id
// @access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const challan = await Challan.findById(req.params.id).populate('customer', 'name phoneNumber');
        if (!challan) {
            return res.status(404).json({ message: 'No challan found.' });
        }
        res.status(200).json({ challan });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route POST api/challan/create
// @desc Create challan
// @access Private
router.post('/create', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const {
            challanNumber,
            customer,
            customerName,
            customerPhone,
            customerAddress,
            items,
            notes,
            createdBy
        } = req.body;

        if (!challanNumber) {
            return res.status(400).json({ error: 'Challan number is required.' });
        }

        const existingChallan = await Challan.findOne({ challanNumber });
        if (existingChallan) {
            return res.status(400).json({ error: 'Challan number already exists.' });
        }

        const challan = new Challan({
            challanNumber,
            customer,
            customerName,
            customerPhone,
            customerAddress,
            items,
            notes,
            createdBy
        });

        const savedChallan = await challan.save();

        // Deduct stock
        await updateProductStock(items, 'deduct');

        res.status(200).json({
            success: true,
            message: 'Challan created successfully.',
            challan: savedChallan
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route PUT api/challan/settle/:id
// @desc Settle challan items (Return or Mark as Billed)
// @access Private
router.put('/settle/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { itemSettlements } = req.body; // Array of { itemId, type: 'return'|'bill', quantity }
        const challan = await Challan.findById(req.params.id);

        if (!challan) {
            return res.status(404).json({ message: 'Challan not found.' });
        }

        for (const settlement of itemSettlements) {
            const item = challan.items.id(settlement.itemId);
            if (item) {
                if (settlement.type === 'return') {
                    item.returnedQuantity += Number(settlement.quantity);
                    // Add back to stock only if it has a linked product
                    if (item.product) {
                        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: Number(settlement.quantity) } });
                    }
                } else if (settlement.type === 'bill') {
                    item.billedQuantity += Number(settlement.quantity);
                    // Add back to stock so Invoice creation can deduct it again without double-deduction
                    if (item.product) {
                        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: Number(settlement.quantity) } });
                    }
                }
            }
        }

        // Check if fully settled
        const allSettled = challan.items.every(item => (item.returnedQuantity + item.billedQuantity) >= item.quantity);
        if (allSettled) {
            challan.status = 'Converted'; // Or 'Settled'
        }

        await challan.save();
        res.status(200).json({ success: true, challan });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route DELETE api/challan/:id
// @desc Delete challan and restore stock
// @access Private
router.delete('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const challan = await Challan.findById(req.params.id);
        if (!challan) {
            return res.status(404).json({ message: 'No record found.' });
        }

        // Restore stock for items that were NOT returned or billed
        const itemsToRestore = challan.items.map(item => {
            const qtyToRestore = item.quantity - (item.returnedQuantity || 0) - (item.billedQuantity || 0);
            if (qtyToRestore > 0) {
                return {
                    product: item.product,
                    quantity: qtyToRestore
                };
            }
            return null;
        }).filter(i => i !== null);

        if (itemsToRestore.length > 0) {
            await updateProductStock(itemsToRestore, 'restore');
        }

        await Challan.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Record deleted and stock restored.'
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

const updateProductStock = async (items, operation) => {
    const validItems = items.filter(i => i.product);
    if (validItems.length === 0) return;

    const bulkOps = validItems.map(item => {
        const adjustment = operation === 'deduct' ? -item.quantity : item.quantity;
        return {
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { quantity: adjustment } }
            }
        };
    });
    if (bulkOps.length > 0) await Product.bulkWrite(bulkOps);
};

module.exports = router;
