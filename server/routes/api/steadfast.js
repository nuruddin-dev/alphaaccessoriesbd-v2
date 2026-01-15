const express = require('express');
const router = express.Router();
const axios = require('axios');
const SteadfastOrder = require('../../models/steadfastOrder');
const Product = require('../../models/product');
const Account = require('../../models/account');
const Transaction = require('../../models/transaction');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

const STEADFAST_API_KEY = 'bqjf912zvykd2mzyc4r4hljmcqeriaiw';
const STEADFAST_SECRET_KEY = 'g98ufuanmspwgqfnk7ah7fgd';
const BASE_URL = 'https://portal.packzy.com/api/v1';

const headers = {
    'Api-Key': STEADFAST_API_KEY,
    'Secret-Key': STEADFAST_SECRET_KEY,
    'Content-Type': 'application/json'
};

// @route   POST api/steadfast/create
// @desc    Create a new order and track advance/profit
router.post('/create', auth, async (req, res) => {
    try {
        const {
            invoice,
            recipient_name,
            recipient_phone,
            recipient_address,
            cod_amount,
            note,
            item_description,
            advanceAmount = 0,
            advanceAccount,
            productCost = 0,
            packagingCharge = 20,
            items = [],
            createdBy = 'Admin'
        } = req.body;

        // 1. Create order in Steadfast
        const response = await axios.post(`${BASE_URL}/create_order`, {
            invoice,
            recipient_name,
            recipient_phone,
            recipient_address,
            cod_amount,
            note,
            item_description
        }, { headers });

        if (response.data.status === 200) {
            const consignment = response.data.consignment;
            const codCharge = Number(cod_amount) * 0.01;

            // 2. Handle Advance Payment if exists
            if (advanceAmount > 0 && advanceAccount) {
                const acc = await Account.findById(advanceAccount);
                if (acc) {
                    acc.balance += Number(advanceAmount);
                    await acc.save();

                    const trans = new Transaction({
                        account: acc._id,
                        type: 'credit',
                        amount: Number(advanceAmount),
                        reference: `Advance for Invoice #${invoice}`,
                        description: `Customer advance for Steadfast order #${invoice}`,
                        date: new Date()
                    });
                    await trans.save();
                }
            }

            const newOrder = new SteadfastOrder({
                invoice: consignment.invoice,
                consignmentId: consignment.consignment_id,
                trackingCode: consignment.tracking_code,
                recipientName: consignment.recipient_name,
                recipientPhone: consignment.recipient_phone,
                recipientAddress: consignment.recipient_address,
                codAmount: consignment.cod_amount,
                advanceAmount: Number(advanceAmount),
                advanceAccount: (advanceAccount && advanceAccount !== '') ? advanceAccount : undefined,
                productCost: Number(productCost),
                packagingCharge: Number(packagingCharge),
                codCharge: codCharge,
                status: consignment.status,
                note: consignment.note,
                itemDescription: item_description,
                items: items.filter(i => i.product && i.product !== '').map(i => ({
                    product: i.product,
                    quantity: Number(i.quantity) || 1,
                    price: Number(i.price) || 0,
                    buyingPrice: Number(i.buyingPrice) || 0
                })),
                createdBy: createdBy || 'Admin',
                profit: 0 // Will be finalized after getting deliveryCharge
            });

            await newOrder.save();

            // 3. Stock Management: Reduce stock for each item
            const validItems = items.filter(i => i.product && i.product !== '');
            for (const item of validItems) {
                try {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { quantity: -(Number(item.quantity) || 0) }
                    });
                } catch (stockErr) {
                    console.error('Stock Update Error:', stockErr);
                }
            }

            res.status(200).json({ success: true, order: newOrder });
        } else {
            res.status(400).json({ error: response.data.message || 'Failed to create order in Steadfast.' });
        }
    } catch (error) {
        console.error('Order Create Error:', error.response?.data || error.message);
        res.status(400).json({ error: error.response?.data?.message || 'Error creating order.' });
    }
});

// @route   POST api/steadfast/cancel
// @desc    Cancel a parcel by consignment ID
router.post('/cancel', auth, async (req, res) => {
    try {
        const { consignment_id } = req.body;

        if (!consignment_id) {
            return res.status(400).json({ error: 'Consignment ID is required.' });
        }

        console.log('Cancel request for consignment:', consignment_id);

        const response = await axios.post(`${BASE_URL}/cancel_order`, {
            consignment_id
        }, { headers });

        console.log('Steadfast cancel response:', JSON.stringify(response.data, null, 2));

        if (response.data.status === 200) {
            // Update local order status
            await SteadfastOrder.findOneAndUpdate(
                { consignmentId: String(consignment_id) },
                { status: 'cancelled', updated: new Date() }
            );
            res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
        } else {
            console.error('Steadfast returned non-200 status:', response.data);
            res.status(400).json({ error: response.data.message || JSON.stringify(response.data) || 'Failed to cancel order.' });
        }
    } catch (error) {
        console.error('Cancel Error - Full error:', error);
        console.error('Cancel Error - Response data:', error.response?.data);
        console.error('Cancel Error - Response status:', error.response?.status);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || JSON.stringify(error.response?.data) || error.message;
        res.status(400).json({ error: errorMsg });
    }
});

// @route   POST api/steadfast/update
// @desc    Update parcel details (recipient info, COD amount)
router.post('/update', auth, async (req, res) => {
    try {
        const { consignment_id, recipient_name, recipient_phone, recipient_address, cod_amount, note } = req.body;

        if (!consignment_id) {
            return res.status(400).json({ error: 'Consignment ID is required.' });
        }

        console.log('Update request for consignment:', consignment_id, 'with data:', { recipient_name, recipient_phone, recipient_address, cod_amount, note: note ? 'yes' : 'no' });

        const updateData = { consignment_id };
        if (recipient_name) updateData.recipient_name = recipient_name;
        if (recipient_phone) updateData.recipient_phone = recipient_phone;
        if (recipient_address) updateData.recipient_address = recipient_address;
        if (cod_amount !== undefined) updateData.cod_amount = cod_amount;
        if (note) updateData.note = note;

        console.log('Sending to Steadfast:', updateData);

        const response = await axios.post(`${BASE_URL}/update_order`, updateData, { headers });

        console.log('Steadfast response:', JSON.stringify(response.data, null, 2));

        if (response.data.status === 200) {
            // Update local order
            const localUpdate = {};
            if (recipient_name) localUpdate.recipientName = recipient_name;
            if (recipient_phone) localUpdate.recipientPhone = recipient_phone;
            if (recipient_address) localUpdate.recipientAddress = recipient_address;
            if (cod_amount !== undefined) localUpdate.codAmount = Number(cod_amount);
            if (note) {
                localUpdate.note = note;
                localUpdate.itemDescription = note;
            }
            localUpdate.updated = new Date();

            await SteadfastOrder.findOneAndUpdate(
                { consignmentId: String(consignment_id) },
                localUpdate
            );
            res.status(200).json({ success: true, message: 'Order updated successfully.' });
        } else {
            console.error('Steadfast returned non-200 status:', response.data);
            res.status(400).json({ error: response.data.message || JSON.stringify(response.data) || 'Failed to update order.' });
        }
    } catch (error) {
        console.error('Update Error - Full error:', error);
        console.error('Update Error - Response data:', error.response?.data);
        console.error('Update Error - Response status:', error.response?.status);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || JSON.stringify(error.response?.data) || error.message;
        res.status(400).json({ error: errorMsg });
    }
});

// @route   GET api/steadfast/tracking/:consignmentId
// @desc    Get tracking info for a parcel
router.get('/tracking/:consignmentId', auth, async (req, res) => {
    try {
        const { consignmentId } = req.params;

        // First get local order info
        const localOrder = await SteadfastOrder.findOne({ consignmentId: String(consignmentId) });

        // Get status from Steadfast
        const response = await axios.get(`${BASE_URL}/status_by_cid/${consignmentId}`, { headers });

        const trackingInfo = {
            consignment_id: consignmentId,
            local_order: localOrder ? {
                invoice: localOrder.invoice,
                trackingCode: localOrder.trackingCode,
                recipientName: localOrder.recipientName,
                recipientPhone: localOrder.recipientPhone,
                recipientAddress: localOrder.recipientAddress,
                codAmount: localOrder.codAmount,
                advanceAmount: localOrder.advanceAmount,
                productCost: localOrder.productCost,
                deliveryCharge: localOrder.deliveryCharge,
                packagingCharge: localOrder.packagingCharge,
                profit: localOrder.profit,
                status: localOrder.status,
                note: localOrder.note,
                itemDescription: localOrder.itemDescription,
                created: localOrder.created
            } : null,
            steadfast_status: response.data.status === 200 ? {
                delivery_status: response.data.delivery_status,
                tracking_code: response.data.tracking_code
            } : null
        };

        res.status(200).json({ success: true, tracking: trackingInfo });
    } catch (error) {
        console.error('Tracking Error:', error.response?.data || error.message);
        res.status(400).json({ error: 'Error fetching tracking info.' });
    }
});

// @route   GET api/steadfast/orders
// @desc    Get all steadfast orders from database
router.get('/orders', auth, async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.created = { $gte: startOfDay, $lte: endOfDay };
        }

        const orders = await SteadfastOrder.find(query).sort('-created');
        res.status(200).json({ orders });
    } catch (error) {
        res.status(400).json({ error: 'Error fetching orders.' });
    }
});

// @route   GET api/steadfast/status/:invoice
// @desc    Check delivery status and update profit data
router.get('/status/:invoice', auth, async (req, res) => {
    try {
        const order = await SteadfastOrder.findOne({ invoice: req.params.invoice });
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        // 1. Get status from Steadfast
        const response = await axios.get(`${BASE_URL}/status_by_invoice/${req.params.invoice}`, { headers });

        if (response.data.status === 200) {
            const newStatus = response.data.delivery_status;
            let updateData = { status: newStatus, updated: new Date() };

            // 2. If delivered, try to find delivery charge in payments to calculate profit
            if (newStatus === 'delivered' || newStatus === 'delivered_approval_pending') {
                try {
                    const paymentsRes = await axios.get(`${BASE_URL}/payments`, { headers });
                    const payments = paymentsRes.data.payments || [];

                    for (let i = 0; i < Math.min(payments.length, 10); i++) {
                        const p = payments[i];
                        const pId = p.payment_id || p.id;
                        if (!pId) continue;

                        const detail = await axios.get(`${BASE_URL}/payments/${pId}`, { headers });
                        const paymentData = detail.data.payment || detail.data;
                        const consignments = paymentData.consignments || [];

                        const found = consignments.find(c =>
                            (c.invoice && c.invoice !== 'N/A' && c.invoice === req.params.invoice) ||
                            String(c.consignment_id) === String(order.consignmentId) ||
                            String(c.tracking_code) === String(order.trackingCode)
                        );

                        if (found && found.delivery_charge) {
                            updateData.deliveryCharge = Number(found.delivery_charge);
                            // Profit = (Advance + COD) - Cost - 1% COD - Delivery - Packaging
                            const codCharge = Number(order.codAmount) * 0.01;
                            updateData.codCharge = codCharge;
                            updateData.profit = (order.advanceAmount + order.codAmount) - order.productCost - codCharge - updateData.deliveryCharge - order.packagingCharge;
                            break;
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch delivery charge from payments', e.message);
                }
            }

            const updatedOrder = await SteadfastOrder.findOneAndUpdate(
                { invoice: req.params.invoice },
                updateData,
                { new: true }
            );
            res.status(200).json({ status: newStatus, order: updatedOrder });
        } else {
            res.status(400).json({ error: 'Failed to fetch status.' });
        }
    } catch (error) {
        res.status(400).json({ error: 'Error calling Steadfast API.' });
    }
});

// @route   GET api/steadfast/balance
// @desc    Get current balance from Steadfast API
router.get('/balance', auth, async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/get_balance`, { headers });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching balance.' });
    }
});

// @route   GET api/steadfast/payments
// @desc    Get payment history from Steadfast API
router.get('/payments', auth, async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/payments`, { headers });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching payments.' });
    }
});

// @route   GET api/steadfast/return-requests
// @desc    Get return requests from Steadfast API
router.get('/return-requests', auth, async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/get_return_requests`, { headers });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching return requests.' });
    }
});

// @route   GET api/steadfast/police-stations
// @desc    Get supported police stations
router.get('/police-stations', auth, async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/police_stations`, { headers });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching police stations.' });
    }
});

// @route   GET api/steadfast/payment/:id
// @desc    Lookup payment details by Payment ID OR Consignment ID (cid)
router.get('/payment/:id', auth, async (req, res) => {
    try {
        const queryId = req.params.id;

        // 1. Try fetching directly as a Payment ID first
        try {
            const resDirect = await axios.get(`${BASE_URL}/payments/${queryId}`, { headers });
            // Steadfast returns status 1 for success in some versions
            if (resDirect.data.status === 1 || resDirect.data.status === 200) {
                const paymentData = resDirect.data.payment || resDirect.data;
                return res.status(200).json({
                    status: 200,
                    message: "Payment found directly",
                    payment_summary: paymentData,
                    consignments: paymentData.consignments || []
                });
            }
        } catch (e) {
            // Not a direct payment ID or error, continue to search
        }

        // 2. Search recent payments for this Consignment ID (cid) or Tracking Code
        const paymentsRes = await axios.get(`${BASE_URL}/payments`, { headers });
        const payments = paymentsRes.data.payments || [];

        // Search the most recent 10 payments to stay within reasonable time/limits
        const searchLimit = Math.min(payments.length, 10);

        for (let i = 0; i < searchLimit; i++) {
            const p = payments[i];
            const pId = p.payment_id || p.id;
            if (!pId) continue;

            try {
                const detailRes = await axios.get(`${BASE_URL}/payments/${pId}`, { headers });
                const paymentData = detailRes.data.payment || detailRes.data;
                const consignments = paymentData.consignments || [];

                const found = consignments.find(c =>
                    String(c.consignment_id) === String(queryId) ||
                    String(c.tracking_code) === String(queryId) ||
                    String(c.invoice) === String(queryId)
                );

                if (found) {
                    return res.status(200).json({
                        status: 200,
                        message: "Payment found via search",
                        payment_summary: p,
                        consignments: consignments,
                        matched_item: found
                    });
                }
            } catch (err) {
                console.error(`Error fetching detail for payment ${pId}:`, err.message);
                continue;
            }
        }

        res.status(404).json({ error: 'No matching payment found for this ID in recent records.' });
    } catch (error) {
        console.error('Payment Lookup Error:', error.response?.data || error.message);
        res.status(400).json({ error: 'Error during payment lookup process.' });
    }
});
// @desc    Bulk create orders
router.post('/bulk-create', auth, async (req, res) => {
    try {
        const { data } = req.body; // Expecting an array of orders as per doc
        const response = await axios.post(`${BASE_URL}/create_order/bulk-order`, { data }, { headers });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(400).json({ error: 'Error creating bulk orders.' });
    }
});

// @route   GET api/steadfast/sync-history
// @desc    Sync historical orders from payments
router.get('/sync-history', auth, async (req, res) => {
    try {
        const paymentsResponse = await axios.get(`${BASE_URL}/payments`, { headers });
        const payments = paymentsResponse.data.payments || [];

        let syncedCount = 0;
        for (const payment of payments) {
            try {
                const pId = payment.payment_id || payment.id;
                if (!pId) continue;

                const detailResponse = await axios.get(`${BASE_URL}/payments/${pId}`, { headers });
                const paymentData = detailResponse.data.payment || detailResponse.data;
                const consignments = paymentData.consignments || [];

                for (const c of consignments) {
                    const searchKey = c.invoice && c.invoice !== 'N/A' ? { invoice: c.invoice } : { consignmentId: c.consignment_id };
                    const existing = await SteadfastOrder.findOne(searchKey);

                    if (!existing) {
                        const newOrder = new SteadfastOrder({
                            invoice: c.invoice || `SYNC-${c.consignment_id}`,
                            consignmentId: c.consignment_id,
                            trackingCode: c.tracking_code,
                            recipientName: c.recipient_name || 'Historical Customer',
                            recipientPhone: c.recipient_phone || 'N/A',
                            recipientAddress: c.recipient_address || 'N/A',
                            codAmount: parseFloat(c.cod_amount) || 0,
                            deliveryCharge: parseFloat(c.delivery_charge) || 0,
                            status: c.status || 'delivered',
                            note: c.note || '',
                            itemDescription: 'Historical Sync',
                            profit: 0 // Will need manual cost updates for history
                        });
                        await newOrder.save();
                        syncedCount++;
                    } else if (existing && (!existing.deliveryCharge || existing.deliveryCharge === 0)) {
                        // Update charge for existing orders if we found it now
                        existing.deliveryCharge = parseFloat(c.delivery_charge) || 0;
                        const codCharge = (existing.codAmount || 0) * 0.01;
                        existing.codCharge = codCharge;
                        existing.profit = (existing.advanceAmount + existing.codAmount) - (existing.productCost || 0) - codCharge - existing.deliveryCharge - (existing.packagingCharge || 0);
                        await existing.save();
                    }
                }
            } catch (innerError) {
                console.error(`Error syncing payment detail for ${payment.id}:`, innerError.message);
                // Continue to next payment instead of failing entire request
            }
        }
        res.status(200).json({ success: true, syncedCount });
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        console.error('Sync History Error:', errorMsg);
        res.status(400).json({ error: `Sync failed: ${errorMsg}` });
    }
});

// @route   POST api/steadfast/sync-discovery
// @desc    Discover and sync orders by checking a list of invoice IDs
router.post('/sync-discovery', auth, async (req, res) => {
    try {
        const { invoices } = req.body; // Array of invoice IDs
        if (!Array.isArray(invoices)) return res.status(400).json({ error: 'Invoices must be an array.' });

        let foundCount = 0;
        for (const inv of invoices) {
            // Check if already in our DB
            const existing = await SteadfastOrder.findOne({ invoice: inv });
            if (existing) continue;

            try {
                // Try to find status on Steadfast
                const response = await axios.get(`${BASE_URL}/status_by_invoice/${inv}`, { headers });
                // Note: The status API doesn't return full details, only delivery_status.
                // However, we can use this to identify that the order EXISTS on their end.
                // If it exists, we might need the Tracking Code though.
                // The status_by_invoice API might not be enough to populate a FULL record
                // but it helps confirm existence.

                // If the user wants a full sync, they'd need more info.
                // But for discovery, even just knowing it's there is a start.
            } catch (e) {
                // Skip if not found
            }
        }
        res.status(200).json({ success: true, foundCount });
    } catch (error) {
        res.status(400).json({ error: 'Discovery sync failed.' });
    }
});

// @route   PUT api/steadfast/local-update/:id
// @desc    Update order in LOCAL database only (for manual adjustments)
router.put('/local-update/:id', auth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const updateData = req.body;

        // Ensure profit is recalculated if products or COD change
        if (updateData.items || updateData.codAmount !== undefined || updateData.productCost !== undefined) {
            const order = await SteadfastOrder.findById(orderId);
            if (order) {
                const cod = updateData.codAmount !== undefined ? Number(updateData.codAmount) : order.codAmount;
                const cost = updateData.productCost !== undefined ? Number(updateData.productCost) : order.productCost;
                const delivery = order.deliveryCharge || 0;
                const packaging = updateData.packagingCharge !== undefined ? Number(updateData.packagingCharge) : order.packagingCharge;
                const codCharge = cod * 0.01;

                if (delivery > 0) {
                    updateData.profit = (order.advanceAmount + cod) - cost - codCharge - delivery - packaging;
                    updateData.codCharge = codCharge;
                } else {
                    updateData.profit = 0;
                }
            }
        }

        updateData.updated = new Date();
        const updatedOrder = await SteadfastOrder.findByIdAndUpdate(orderId, updateData, { new: true });
        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Local Update Error:', error);
        res.status(400).json({ error: 'Failed to update local order.' });
    }
});

// @route   DELETE api/steadfast/local-delete/:id
// @desc    Delete order from LOCAL database only
router.delete('/local-delete/:id', auth, async (req, res) => {
    try {
        await SteadfastOrder.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Order deleted from local database.' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete order.' });
    }
});

// @route   POST api/steadfast/receive-return
// @desc    Receive returned items back into stock
router.post('/receive-return', auth, async (req, res) => {
    try {
        const { orderId, items } = req.body; // items is optional, if provided only these will be received
        const order = await SteadfastOrder.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const itemsToReceive = items || order.items;

        for (const item of itemsToReceive) {
            if (item.product) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { quantity: (Number(item.quantity) || 0) }
                });
            }
        }

        order.status = 'returned_received';
        order.updated = new Date();
        await order.save();

        res.status(200).json({ success: true, message: 'Stock updated and return received.' });
    } catch (error) {
        console.error('Receive Return Error:', error);
        res.status(400).json({ error: 'Failed to receive return.' });
    }
});

// Webhook token for Steadfast - they will send this as Bearer token
const WEBHOOK_TOKEN = 'be64d17d4abaeb7848fb5e9aa44459ff524a4c1cd4deee94a9452c34ac463d32';

// @route   POST api/steadfast/webhook
// @desc    Receive webhook notifications from Steadfast for delivery status and tracking updates
router.post('/webhook', async (req, res) => {
    try {
        // Validate Bearer token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Webhook: Missing authorization header');
            return res.status(401).json({ status: 'error', message: 'Unauthorized - Missing token' });
        }

        const token = authHeader.split(' ')[1];
        if (token !== WEBHOOK_TOKEN) {
            console.log('Webhook: Invalid token received');
            return res.status(401).json({ status: 'error', message: 'Unauthorized - Invalid token' });
        }

        const { notification_type, consignment_id, invoice, cod_amount, status, delivery_charge, tracking_message, updated_at } = req.body;

        console.log(`Webhook received: ${notification_type} for invoice ${invoice} / consignment ${consignment_id}`);

        if (notification_type === 'delivery_status') {
            // Find the order by invoice or consignment_id
            let order = await SteadfastOrder.findOne({ invoice: invoice });
            if (!order) {
                order = await SteadfastOrder.findOne({ consignmentId: String(consignment_id) });
            }

            if (!order) {
                console.log(`Webhook: Order not found for invoice ${invoice} / consignment ${consignment_id}`);
                return res.status(404).json({ status: 'error', message: 'Order not found in our system' });
            }

            // Update order with delivery info
            const codCharge = (order.codAmount || 0) * 0.01;
            const profit = (order.advanceAmount || 0) + (order.codAmount || 0) - (order.productCost || 0) - codCharge - (delivery_charge || 0) - (order.packagingCharge || 0);

            order.status = status?.toLowerCase() || order.status;
            order.deliveryCharge = Number(delivery_charge) || 0;
            order.codCharge = codCharge;
            order.profit = profit;
            order.note = tracking_message || order.note;
            order.updated = new Date();

            await order.save();

            console.log(`Webhook: Updated order ${invoice} - Status: ${status}, Delivery Charge: ${delivery_charge}, Profit: ${profit}`);

            return res.status(200).json({ status: 'success', message: 'Delivery status updated successfully' });

        } else if (notification_type === 'tracking_update') {
            // Find and update tracking info
            let order = await SteadfastOrder.findOne({ invoice: invoice });
            if (!order) {
                order = await SteadfastOrder.findOne({ consignmentId: String(consignment_id) });
            }

            if (order) {
                order.note = tracking_message || order.note;
                order.updated = new Date();
                await order.save();
                console.log(`Webhook: Tracking update for ${invoice} - ${tracking_message}`);
            }

            return res.status(200).json({ status: 'success', message: 'Tracking update received' });

        } else {
            console.log(`Webhook: Unknown notification type: ${notification_type}`);
            return res.status(200).json({ status: 'success', message: 'Webhook received (unknown type)' });
        }

    } catch (error) {
        console.error('Webhook Error:', error.message);
        return res.status(500).json({ status: 'error', message: 'Internal server error processing webhook' });
    }
});

module.exports = router;
