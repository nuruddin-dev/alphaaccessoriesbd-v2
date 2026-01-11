const express = require('express');
const Mongoose = require('mongoose');
const router = express.Router();
const ImportOrder = require('../../models/import');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// Helper to calculate buying price per item
const calculateItemBuyingPrice = (item, costs) => {
    const rmbRate = costs.rmbRate || 0;
    const rawPriceBDT = (item.priceRMB || 0) * rmbRate;

    let taxPerItem = 0;
    if (costs.taxType === 'per_item') {
        taxPerItem = costs.taxValue || 0;
    } else if (costs.taxType === 'per_kg' && (item.perCtnWeight || 0) > 0 && (item.quantityPerCtn || 0) > 0) {
        const weightPerItem = item.perCtnWeight / item.quantityPerCtn;
        taxPerItem = weightPerItem * (costs.taxValue || 0);
    } else if (costs.taxType === 'per_ctn' && (item.quantityPerCtn || 0) > 0) {
        taxPerItem = (costs.taxValue || 0) / item.quantityPerCtn;
    }

    let laborPerItem = 0;
    if ((costs.labourBillPerCtn || 0) > 0 && (item.quantityPerCtn || 0) > 0) {
        laborPerItem = costs.labourBillPerCtn / item.quantityPerCtn;
    }

    return rawPriceBDT + taxPerItem + laborPerItem;
};

// Generate unique shipment ID
const generateShipmentId = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SHP-${dateStr}-${random}`;
};

// @route   GET api/import
// @desc    Get all import orders
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const imports = await ImportOrder.find()
            .populate('supplier')
            .sort('-created');
        res.status(200).json({ imports });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   GET api/import/by-supplier/:supplierId
// @desc    Get all import orders for a specific supplier
// @access  Private
router.get('/by-supplier/:supplierId', auth, async (req, res) => {
    try {
        const imports = await ImportOrder.find({ supplier: req.params.supplierId })
            .populate('supplier')
            .populate('items.product', 'name shortName sku')
            .sort('-created');
        res.status(200).json({ imports });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   GET api/import/:id
// @desc    Get import order details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const importOrder = await ImportOrder.findById(req.params.id)
            .populate('supplier')
            .populate('items.product', 'name shortName sku');
        res.status(200).json({ importOrder });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   POST api/import/add
// @desc    Create/Add new import order
// @access  Private
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { supplier, orderDate, notes, items, costs } = req.body;

        const importOrder = new ImportOrder({
            orderNumber: `IMP-${Date.now()}`,
            supplier,
            orderDate,
            notes,
            items,
            costs
        });

        const savedOrder = await importOrder.save();

        res.status(200).json({
            success: true,
            message: 'Import order added successfully!',
            importOrder: savedOrder
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   PUT api/import/:id
// @desc    Update import order
// @access  Private
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const update = req.body;
        const query = { _id: req.params.id };

        const importOrder = await ImportOrder.findOneAndUpdate(query, update, {
            new: true
        });

        res.status(200).json({
            success: true,
            message: 'Import order updated successfully!',
            importOrder
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   POST api/import/:id/shipment/add
// @desc    Add a new shipment (starts as Pending)
// @access  Private
router.post('/:id/shipment/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { shipmentDate, items, note, shipmentId } = req.body;
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const newShipmentId = shipmentId || generateShipmentId();

        order.shipments.push({
            shipmentId: newShipmentId,
            shipmentDate: shipmentDate || new Date(),
            items,
            note,
            status: 'Pending'
        });

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Shipment added successfully!',
            importOrder: order
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   PUT api/import/:id/shipment/:shipmentId/item
// @desc    Add or update an item in a shipment
// @access  Private
router.put('/:id/shipment/:shipmentId/item', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { product, modelName, shortName, quantity, priceRMB, priceBDT, quantityPerCtn, ctn, perCtnWeight } = req.body;
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Find shipment by _id or shipmentId string
        let shipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            shipment = order.shipments.id(req.params.shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found.' });
        }

        if (shipment.status === 'Received') {
            return res.status(400).json({ error: 'Cannot modify a received shipment.' });
        }

        // Check if item already exists in shipment
        const existingItemIndex = shipment.items.findIndex(i =>
            (product && i.product && i.product.toString() === product) ||
            (!product && i.modelName === modelName)
        );

        const newItem = {
            product,
            modelName,
            shortName,
            quantityPerCtn: Number(quantityPerCtn) || 0,
            ctn: Number(ctn) || 0,
            quantity: Number(quantity) || 0,
            perCtnWeight: Number(perCtnWeight) || 0,
            priceRMB: Number(priceRMB) || 0,
            priceBDT: Number(priceBDT) || 0,
            totalPriceRMB: (Number(quantity) || 0) * (Number(priceRMB) || 0),
            totalPriceBDT: (Number(quantity) || 0) * (Number(priceBDT) || 0)
        };

        if (existingItemIndex >= 0) {
            shipment.items[existingItemIndex] = newItem;
        } else {
            shipment.items.push(newItem);
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Item updated successfully!',
            importOrder: order
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   DELETE api/import/:id/shipment/:shipmentId/item/:itemId
// @desc    Delete an item from a shipment
// @access  Private
router.delete('/:id/shipment/:shipmentId/item/:itemId', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Find shipment by _id or shipmentId string
        let shipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            shipment = order.shipments.id(req.params.shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found.' });
        }

        if (shipment.status === 'Received') {
            return res.status(400).json({ error: 'Cannot modify a received shipment.' });
        }

        // Use pull to remove the item by ID
        shipment.items.pull(req.params.itemId);
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Item deleted successfully!',
            importOrder: order
        });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   POST api/import/:id/shipment/:shipmentId/item/:itemId/move-to-shipped
// @desc    Move a single item from pending shipment to shipped list
// @access  Private
router.post('/:id/shipment/:shipmentId/item/:itemId/move-to-shipped', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Find shipment by _id or shipmentId string
        let sourceShipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            sourceShipment = order.shipments.id(req.params.shipmentId);
        }
        if (!sourceShipment) {
            sourceShipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }

        if (!sourceShipment) {
            return res.status(404).json({ error: 'Source shipment not found.' });
        }

        if (sourceShipment.status !== 'Pending') {
            return res.status(400).json({ error: 'Can only move items from pending shipments.' });
        }

        // Find the item to move
        const itemToMove = sourceShipment.items.id(req.params.itemId);
        if (!itemToMove) {
            return res.status(404).json({ error: 'Item not found.' });
        }

        // Copy item data before removing
        const itemData = {
            product: itemToMove.product,
            modelName: itemToMove.modelName,
            shortName: itemToMove.shortName,
            quantityPerCtn: itemToMove.quantityPerCtn,
            ctn: itemToMove.ctn,
            quantity: itemToMove.quantity,
            perCtnWeight: itemToMove.perCtnWeight,
            priceRMB: itemToMove.priceRMB,
            priceBDT: itemToMove.priceBDT,
            totalPriceRMB: itemToMove.totalPriceRMB,
            totalPriceBDT: itemToMove.totalPriceBDT
        };

        // Find or create a target "Shipped" shipment
        const { targetShipmentId } = req.body;
        let targetShipment;

        if (targetShipmentId && targetShipmentId !== 'new') {
            // Find specific shipment by _id or shipmentId
            if (Mongoose.Types.ObjectId.isValid(targetShipmentId)) {
                targetShipment = order.shipments.id(targetShipmentId);
            }
            if (!targetShipment) {
                targetShipment = order.shipments.find(s => s.shipmentId === targetShipmentId);
            }

            // Validate the target shipment
            if (targetShipment) {
                if (targetShipment.status !== 'Shipped') {
                    return res.status(400).json({ error: 'Target shipment must be in Shipped status.' });
                }
                if (targetShipment.isCompleted === true) {
                    return res.status(400).json({ error: 'Target shipment is already completed.' });
                }
                targetShipment.items.push(itemData);
            } else {
                return res.status(404).json({ error: 'Selected target shipment not found.' });
            }
        } else {
            // Default logic: Find or create a "Shipped" shipment that's still editable (same date and NOT completed)
            const today = new Date().toISOString().slice(0, 10);
            targetShipment = order.shipments.find(s =>
                s.status === 'Shipped' &&
                s.isCompleted !== true &&
                s.shipmentDate &&
                s.shipmentDate.toISOString().slice(0, 10) === today
            );

            if (!targetShipment || targetShipmentId === 'new') {
                // Create new shipped shipment
                const newShipmentId = generateShipmentId();
                order.shipments.push({
                    shipmentId: newShipmentId,
                    shipmentDate: new Date(),
                    status: 'Shipped',
                    items: [itemData]
                });
            } else {
                // Add to existing shipped shipment found
                targetShipment.items.push(itemData);
            }
        }

        // Remove item from source shipment
        sourceShipment.items.pull(req.params.itemId);

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Item moved to shipped list!',
            importOrder: order
        });
    } catch (error) {
        console.error('Error moving item:', error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});
// @route   POST api/import/:id/shipment/:shipmentId/complete
// @desc    Mark a shipped shipment as completed (cannot add more items to it)
// @access  Private
router.post('/:id/shipment/:shipmentId/complete', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const order = await ImportOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        let shipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            shipment = order.shipments.id(req.params.shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }
        if (!shipment) return res.status(404).json({ error: 'Shipment not found.' });

        if (shipment.status !== 'Shipped') {
            return res.status(400).json({ error: 'Only shipped shipments can be marked as completed.' });
        }

        shipment.isCompleted = true;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Shipment marked as completed!',
            importOrder: order
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route   POST api/import/:id/shipment/:shipmentId/undo-complete
// @desc    Undo completed status for a shipped shipment
// @access  Private
router.post('/:id/shipment/:shipmentId/undo-complete', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const order = await ImportOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        let shipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            shipment = order.shipments.id(req.params.shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }
        if (!shipment) return res.status(404).json({ error: 'Shipment not found.' });

        shipment.isCompleted = false;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Shipment is now open again!',
            importOrder: order
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route   POST api/import/:id/shipment/:shipmentId/item/:itemId/undo-shipped
// @desc    Move an item from shipped back to pending
// @access  Private
router.post('/:id/shipment/:shipmentId/item/:itemId/undo-shipped', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const order = await ImportOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        let sourceShipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            sourceShipment = order.shipments.id(req.params.shipmentId);
        }
        if (!sourceShipment) {
            sourceShipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }
        if (!sourceShipment) return res.status(404).json({ error: 'Source shipment not found.' });

        const itemToMove = sourceShipment.items.id(req.params.itemId);
        if (!itemToMove) return res.status(404).json({ error: 'Item not found.' });

        const itemData = {
            product: itemToMove.product,
            modelName: itemToMove.modelName,
            shortName: itemToMove.shortName,
            quantityPerCtn: itemToMove.quantityPerCtn,
            ctn: itemToMove.ctn,
            quantity: itemToMove.quantity,
            perCtnWeight: itemToMove.perCtnWeight,
            priceRMB: itemToMove.priceRMB,
            priceBDT: itemToMove.priceBDT,
            totalPriceRMB: itemToMove.totalPriceRMB,
            totalPriceBDT: itemToMove.totalPriceBDT
        };

        // Find a pending shipment to move it back to
        let targetShipment = order.shipments.find(s => s.status === 'Pending');

        if (!targetShipment) {
            // Create a new pending shipment if none exists
            const newShipmentId = generateShipmentId();
            order.shipments.push({
                shipmentId: newShipmentId,
                status: 'Pending',
                items: [itemData]
            });
        } else {
            targetShipment.items.push(itemData);
        }

        // Remove from shipped shipment
        sourceShipment.items.pull(req.params.itemId);
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Item moved back to pending!',
            importOrder: order
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed.' });
    }
});

// @route   PUT api/import/:id/shipment/:shipmentId/mark-shipped
// @desc    Mark a shipment as shipped (move from Pending to Shipped)
// @access  Private
router.put('/:id/shipment/:shipmentId/mark-shipped', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { shipmentDate } = req.body;
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Find shipment by _id or shipmentId string
        let shipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            shipment = order.shipments.id(req.params.shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found.' });
        }

        if (shipment.status !== 'Pending') {
            return res.status(400).json({ error: 'Only pending shipments can be marked as shipped.' });
        }

        if (shipment.items.length === 0) {
            return res.status(400).json({ error: 'Cannot ship an empty shipment. Add items first.' });
        }

        shipment.status = 'Shipped';
        shipment.shipmentDate = shipmentDate || new Date();
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Shipment marked as shipped!',
            importOrder: order
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   POST api/import/:id/receive
// @desc    Receive shipment and update stock
// @access  Private
router.post('/:id/receive', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { shipmentId, receivedDate } = req.body;
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Find shipment by _id or shipmentId string
        let shipment;
        if (Mongoose.Types.ObjectId.isValid(shipmentId)) {
            shipment = order.shipments.id(shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === shipmentId);
        }

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found.' });
        }

        if (shipment.status === 'Received') {
            return res.status(400).json({ error: 'Shipment already received.' });
        }

        // Process Stock Update
        for (const item of shipment.items) {
            // Find Matching Item in Order to get pricing details
            const orderItem = order.items.find(i =>
                (item.product && i.product && i.product.toString() === item.product.toString()) ||
                i.modelName === item.modelName
            );

            if (orderItem) {
                // Calculate Buying Price
                let taxPerItem = 0;
                if (order.costs.taxType === 'total') {
                    const totalQty = order.items.reduce((sum, i) => sum + (i.totalQuantity || 0), 0);
                    if (totalQty > 0) {
                        taxPerItem = (order.costs.taxValue || 0) / totalQty;
                    }
                }

                const calcCosts = { ...order.costs.toObject() };
                if (order.costs.taxType === 'total') {
                    calcCosts.taxType = 'per_item';
                    calcCosts.taxValue = taxPerItem;
                }

                const newBuyingPrice = calculateItemBuyingPrice(orderItem, calcCosts);

                // Find Product in Inventory
                let product;
                if (item.product) {
                    product = await Product.findById(item.product);
                }

                if (!product) {
                    product = await Product.findOne({
                        $or: [
                            { name: item.modelName },
                            { shortName: item.modelName },
                            { shortName: item.shortName },
                            { sku: item.modelName }
                        ]
                    });
                }

                if (product) {
                    product.quantity = (product.quantity || 0) + item.quantity;
                    product.buyingPrice = Math.round(newBuyingPrice);
                    await product.save();
                } else {
                    console.log(`Product ${item.modelName} (ID: ${item.product}) not found during import receive.`);
                }
            }
        }

        shipment.status = 'Received';
        shipment.receivedDate = receivedDate || new Date();
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Shipment received and stock updated!',
            importOrder: order
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   PUT api/import/:id/shipment/:shipmentId/received-date
// @desc    Update received date of a shipment
// @access  Private
router.put('/:id/shipment/:shipmentId/received-date', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { receivedDate } = req.body;
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Find shipment by _id or shipmentId string
        let shipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            shipment = order.shipments.id(req.params.shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found.' });
        }

        shipment.receivedDate = receivedDate;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Received date updated!',
            importOrder: order
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   DELETE api/import/:id/shipment/:shipmentId
// @desc    Delete a shipment
// @access  Private
router.delete('/:id/shipment/:shipmentId', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Find shipment by _id or shipmentId string
        let shipment;
        if (Mongoose.Types.ObjectId.isValid(req.params.shipmentId)) {
            shipment = order.shipments.id(req.params.shipmentId);
        }
        if (!shipment) {
            shipment = order.shipments.find(s => s.shipmentId === req.params.shipmentId);
        }

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found.' });
        }

        if (shipment.status === 'Received') {
            return res.status(400).json({ error: 'Cannot delete a received shipment. Please revert stock first (manual).' });
        }

        // Use pull on the parent array to remove by _id
        order.shipments.pull(shipment._id);
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Shipment deleted successfully!',
            importOrder: order
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route   POST api/import/:id/shipment/create-pending
// @desc    Create a new pending shipment for adding items
// @access  Private
router.post('/:id/shipment/create-pending', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const order = await ImportOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Check if there's already a pending shipment
        const existingPending = order.shipments.find(s => s.status === 'Pending');
        if (existingPending) {
            return res.status(200).json({
                success: true,
                message: 'Pending shipment already exists.',
                shipment: existingPending,
                importOrder: order
            });
        }

        const newShipmentId = generateShipmentId();
        const newShipment = {
            shipmentId: newShipmentId,
            shipmentDate: new Date(),
            status: 'Pending',
            items: []
        };

        order.shipments.push(newShipment);
        await order.save();

        res.status(200).json({
            success: true,
            message: 'New pending shipment created!',
            shipment: order.shipments[order.shipments.length - 1],
            importOrder: order
        });
    } catch (error) {
        console.error('Error creating pending shipment:', error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

module.exports = router;
