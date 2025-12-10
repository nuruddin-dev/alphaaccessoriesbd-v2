const express = require('express');
const router = express.Router();

// Bring in Models & Authorization
const Customer = require('../../models/customer');
const Invoice = require('../../models/invoice');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route GET api/payment/ledger/:customerId
// @desc Get customer ledger - uses purchase_history and payment_history from customer
// @access Private
router.get('/ledger/:customerId', auth, async (req, res) => {
    try {
        const customerId = req.params.customerId;

        // Fetch customer with populated purchase_history
        const customer = await Customer.findById(customerId)
            .populate({
                path: 'purchase_history',
                select: 'invoiceNumber grandTotal subTotal previousDue discount paid due created items'
            });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        // Build ledger entries from purchase_history (invoices)
        const ledgerEntries = [];

        // Add invoices to ledger
        if (customer.purchase_history && customer.purchase_history.length > 0) {
            customer.purchase_history.forEach(invoice => {
                if (invoice) { // Check if invoice exists (not deleted)
                    ledgerEntries.push({
                        type: 'invoice',
                        date: invoice.created,
                        invoiceNumber: invoice.invoiceNumber,
                        description: `Invoice #${invoice.invoiceNumber}`,
                        subTotal: invoice.subTotal || 0,
                        previousDue: invoice.previousDue || 0,
                        discount: invoice.discount || 0,
                        grandTotal: invoice.grandTotal || 0,
                        paid: invoice.paid || 0,
                        due: invoice.due || 0,
                        items: invoice.items ? invoice.items.length : 0,
                        _id: invoice._id
                    });
                }
            });
        }

        // Add payments to ledger
        if (customer.payment_history && customer.payment_history.length > 0) {
            customer.payment_history.forEach(payment => {
                ledgerEntries.push({
                    type: 'payment',
                    date: payment.date,
                    description: payment.relatedInvoice
                        ? `Payment for Invoice`
                        : 'Due Payment',
                    amount: payment.amount,
                    paymentMethod: payment.paymentMethod,
                    notes: payment.notes,
                    relatedInvoice: payment.relatedInvoice,
                    _id: payment._id
                });
            });
        }

        // Sort by date (ascending for ledger view)
        ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        // For invoices: add only the NEW amount (subTotal - discount - paid), not the full due
        // The 'due' field includes previousDue which would cause double-counting
        // However, the FIRST invoice's previousDue represents the opening balance
        let runningBalance = 0;
        let isFirstInvoice = true;

        ledgerEntries.forEach(entry => {
            if (entry.type === 'invoice') {
                // For the first invoice, include the previousDue as the opening balance
                if (isFirstInvoice && entry.previousDue > 0) {
                    runningBalance += entry.previousDue;
                    entry.openingBalance = entry.previousDue;
                    isFirstInvoice = false;
                }

                // New amount added to balance = subTotal - discount - paid (what they owe from THIS invoice only)
                const discount = entry.discount || 0;
                const newAmount = (entry.subTotal || 0) - discount - (entry.paid || 0);
                runningBalance += newAmount;
                entry.runningBalance = runningBalance;
                entry.newAmount = newAmount; // Store for display
            } else if (entry.type === 'payment') {
                runningBalance -= entry.amount; // Subtract payment
                entry.runningBalance = runningBalance;
            }
        });

        res.status(200).json({
            customer: {
                _id: customer._id,
                name: customer.name,
                phoneNumber: customer.phoneNumber,
                totalDue: customer.due
            },
            ledger: ledgerEntries,
            currentBalance: runningBalance
        });
    } catch (error) {
        console.error('Error fetching ledger:', error);
        res.status(400).json({
            error: 'Your request could not be processed. Please try again.'
        });
    }
});

// @route GET api/payment/customer/:customerId
// @desc Get all payments for a specific customer (from customer.payment_history)
// @access Private
router.get('/customer/:customerId', auth, async (req, res) => {
    try {
        const customerId = req.params.customerId;

        const customer = await Customer.findById(customerId)
            .populate({
                path: 'payment_history.relatedInvoice',
                select: 'invoiceNumber grandTotal due'
            });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        res.status(200).json({
            payments: customer.payment_history || []
        });
    } catch (error) {
        res.status(400).json({
            error: 'Your request could not be processed. Please try again.'
        });
    }
});

// @route POST api/payment/create
// @desc Create a new payment - adds to customer.payment_history
// @access Private
router.post('/create', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const {
            customer: customerId,
            amount,
            relatedInvoice,
            paymentMethod,
            notes,
            createdBy
        } = req.body;

        // Validation
        if (!customerId) {
            return res.status(400).json({ error: 'Customer is required.' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'A valid payment amount is required.' });
        }

        // Check if customer exists
        const customerDoc = await Customer.findById(customerId);
        if (!customerDoc) {
            return res.status(404).json({ error: 'Customer not found.' });
        }

        // Create payment object
        const paymentData = {
            amount,
            date: new Date(),
            relatedInvoice: relatedInvoice || null,
            paymentMethod: paymentMethod || 'cash',
            notes,
            createdBy: createdBy || 'Admin'
        };

        // Add to customer's payment_history
        if (!customerDoc.payment_history) {
            customerDoc.payment_history = [];
        }
        customerDoc.payment_history.push(paymentData);

        // Update customer's due amount
        customerDoc.due = (customerDoc.due || 0) - amount;

        await customerDoc.save();

        // If related invoice exists, update its paid and due amounts
        if (relatedInvoice) {
            const invoice = await Invoice.findById(relatedInvoice);
            if (invoice) {
                invoice.paid = (invoice.paid || 0) + amount;
                invoice.due = invoice.grandTotal - invoice.paid;
                await invoice.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment recorded successfully!',
            payment: paymentData
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(400).json({
            error: 'Your request could not be processed. Please try again.'
        });
    }
});

// @route DELETE api/payment/:customerId/:paymentId
// @desc Delete a payment from customer.payment_history
// @access Private
router.delete('/:customerId/:paymentId', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { customerId, paymentId } = req.params;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        // Find the payment in payment_history
        const paymentIndex = customer.payment_history.findIndex(
            p => p._id.toString() === paymentId
        );

        if (paymentIndex === -1) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        const payment = customer.payment_history[paymentIndex];

        // Revert customer's due amount
        customer.due = (customer.due || 0) + payment.amount;

        // Remove payment from history
        customer.payment_history.splice(paymentIndex, 1);

        await customer.save();

        // If related invoice exists, revert its paid and due amounts
        if (payment.relatedInvoice) {
            const invoice = await Invoice.findById(payment.relatedInvoice);
            if (invoice) {
                invoice.paid = (invoice.paid || 0) - payment.amount;
                invoice.due = invoice.grandTotal - invoice.paid;
                await invoice.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(400).json({
            error: 'Your request could not be processed. Please try again.'
        });
    }
});

module.exports = router;
