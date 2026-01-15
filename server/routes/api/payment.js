const express = require('express');
const router = express.Router();

// Bring in Models & Authorization
const Customer = require('../../models/customer');
const Invoice = require('../../models/invoice');
const Account = require('../../models/account');
const Transaction = require('../../models/transaction');
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
                select: 'invoiceNumber grandTotal subTotal previousDue discount paid due created items totalFee'
            });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        // Build ledger entries from purchase_history (invoices)
        const ledgerEntries = [];
        const invoiceMap = {};

        // Add invoices to ledger
        if (customer.purchase_history && customer.purchase_history.length > 0) {
            customer.purchase_history.forEach(invoice => {
                if (invoice) { // Check if invoice exists (not deleted)
                    invoiceMap[invoice._id.toString()] = invoice.invoiceNumber;
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
                        totalFee: invoice.totalFee || 0,
                        due: invoice.due || 0,
                        items: invoice.items ? invoice.items.map(item => ({
                            name: item.productName,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice
                        })) : [],
                        _id: invoice._id
                    });
                }
            });
        }

        // Add payments to ledger
        if (customer.payment_history && customer.payment_history.length > 0) {
            customer.payment_history.forEach(payment => {
                const invNum = payment.relatedInvoice ? invoiceMap[payment.relatedInvoice.toString()] : null;
                ledgerEntries.push({
                    type: 'payment',
                    date: payment.date,
                    description: `Payment of ৳${payment.amount.toLocaleString()} ${invNum ? 'for Invoice #' + invNum : 'received'}`,
                    amount: payment.amount,
                    paymentMethod: payment.paymentMethod,
                    fee: payment.fee,
                    notes: payment.notes,
                    relatedInvoice: payment.relatedInvoice,
                    _id: payment._id,
                    isPaymentRecord: true // Flag to hide amount in debit/credit column
                });
            });
        }

        // Sort by date (ascending for ledger calculation)
        ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let runningBalance = 0;
        let isFirstInvoice = true;

        ledgerEntries.forEach(entry => {
            if (isFirstInvoice && entry.type === 'invoice') {
                if (entry.previousDue > 0) {
                    runningBalance += entry.previousDue;
                    entry.openingBalance = entry.previousDue;
                }
                isFirstInvoice = false;
            }

            if (entry.type === 'invoice') {
                const discount = entry.discount || 0;
                const checkoutPaid = (entry.paid || 0) - (entry.totalFee || 0);

                const debit = (entry.subTotal || 0) - discount;
                const credit = checkoutPaid;

                runningBalance += (debit - credit);
                entry.runningBalance = runningBalance;
                entry.debit = debit;
                entry.credit = credit;
            } else if (entry.type === 'payment') {
                const credit = (entry.amount || 0) - (entry.fee || 0);
                runningBalance -= credit;
                entry.runningBalance = runningBalance;
                entry.debit = 0;
                entry.credit = credit;
            }
        });

        // Reverse ledger entries so newest appear first (for display)
        ledgerEntries.reverse();

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

// @route GET api/payment/check-ledger-discrepancies
// @desc Check for discrepancies between customer due and ledger balance
// @access Private
router.get('/check-ledger-discrepancies', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const allCustomers = await Customer.find({})
            .populate({
                path: 'purchase_history',
                select: 'subTotal previousDue discount paid totalFee created'
            })
            .select('name phoneNumber due purchase_history payment_history');

        const discrepancies = [];

        for (const customer of allCustomers) {
            let runningBalance = 0;
            let isFirstInvoice = true;

            const sortedInvoices = (customer.purchase_history || [])
                .filter(inv => inv)
                .sort((a, b) => new Date(a.created || 0) - new Date(b.created || 0));

            for (const invoice of sortedInvoices) {
                if (isFirstInvoice) {
                    if (invoice.previousDue > 0) runningBalance += invoice.previousDue;
                    isFirstInvoice = false;
                }
                const discount = invoice.discount || 0;
                const netPaid = (invoice.paid || 0) - (invoice.totalFee || 0);
                runningBalance += (invoice.subTotal || 0) - discount - netPaid;
            }

            const allPayments = customer.payment_history || [];
            // Impact on balance is 0 because payments are reflected in invoice 'paid' field
            for (const payment of allPayments) {
                runningBalance -= ((payment.amount || 0) - (payment.fee || 0));
            }

            // Check difference
            if (Math.abs(runningBalance - (customer.due || 0)) > 0.1) {
                discrepancies.push({
                    _id: customer._id,
                    name: customer.name,
                    phoneNumber: customer.phoneNumber,
                    storedDue: customer.due,
                    calculatedDue: runningBalance,
                    difference: Math.abs(runningBalance - (customer.due || 0))
                });
            }
        }

        res.status(200).json({ discrepancies });

    } catch (error) {
        console.error('Error checking discrepancies:', error);
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
            account,
            fee,
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
            account: account || null,
            fee: fee || 0,
            notes,
            createdBy: createdBy || 'Admin'
        };

        // Add to customer's payment_history
        if (!customerDoc.payment_history) {
            customerDoc.payment_history = [];
        }
        customerDoc.payment_history.push(paymentData);

        await customerDoc.save();

        // Recalculate customer's due based on ledger calculation
        const customerWithInvoices = await Customer.findById(customerId)
            .populate({
                path: 'purchase_history',
                select: 'subTotal previousDue discount paid totalFee created'
            });

        // Calculate running balance using the same logic as ledger endpoint
        let runningBalance = 0;
        let isFirstInvoice = true;

        // Sort invoices by date
        const sortedInvoices = (customerWithInvoices.purchase_history || [])
            .filter(inv => inv)
            .sort((a, b) => new Date(a.created || 0) - new Date(b.created || 0));

        // Calculate balance from invoices
        for (const invoice of sortedInvoices) {
            if (isFirstInvoice) {
                if (invoice.previousDue > 0) {
                    runningBalance += invoice.previousDue;
                }
                isFirstInvoice = false;
            }
            const discount = invoice.discount || 0;
            runningBalance += (invoice.subTotal || 0) - discount - ((invoice.paid || 0) - (invoice.totalFee || 0));
        }

        const allPayments = customerWithInvoices.payment_history || [];
        for (const payment of allPayments) {
            runningBalance -= ((payment.amount || 0) - (payment.fee || 0));
        }

        // Update customer's due to match ledger balance
        customerWithInvoices.due = runningBalance;
        await customerWithInvoices.save();


        // Handle Account Transaction if account is provided
        if (account) {
            const accountDoc = await Account.findById(account);
            if (accountDoc) {
                accountDoc.balance += Number(amount);
                await accountDoc.save();

                // Fetch Invoice Number if relatedInvoice is present
                let invoiceRefNumber = '';
                if (relatedInvoice) {
                    const invDoc = await Invoice.findById(relatedInvoice);
                    if (invDoc) {
                        invoiceRefNumber = invDoc.invoiceNumber;
                    }
                }

                const transaction = new Transaction({
                    account: accountDoc._id,
                    type: 'credit',
                    amount: Number(amount),
                    reference: customerDoc.name,
                    referenceId: relatedInvoice || customerDoc._id,
                    description: `Payment from ${customerDoc.name} ${invoiceRefNumber ? '(Invoice #' + invoiceRefNumber + ')' : ''}`,
                    date: new Date()
                });
                await transaction.save();
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

        // 1. (Reverting Invoice Paid amount is no longer done in standalone mode)

        // 2. Revert Account Balance and Transaction
        if (payment.account) {
            const acc = await Account.findById(payment.account);
            if (acc) {
                acc.balance -= (payment.amount || 0);
                await acc.save();

                // Delete the linked transaction
                // We search by referenceId (which we now set to the Invoice ID or Customer ID)
                await Transaction.deleteOne({
                    referenceId: payment.relatedInvoice || customerId,
                    amount: payment.amount,
                    account: payment.account,
                    type: 'credit'
                });
            }
        }

        // Remove payment from history
        customer.payment_history.splice(paymentIndex, 1);
        await customer.save();


        // Recalculate customer's due based on ledger calculation
        const customerWithInvoices = await Customer.findById(customerId)
            .populate({
                path: 'purchase_history',
                select: 'subTotal previousDue discount paid totalFee created'
            });

        let runningBalance = 0;
        let isFirstInvoice = true;
        const sortedInvoices = (customerWithInvoices.purchase_history || [])
            .filter(inv => inv)
            .sort((a, b) => new Date(a.created || 0) - new Date(b.created || 0));

        // Calculate balance from invoices (only use the checkout 'paid' amount)
        for (const invoice of sortedInvoices) {
            if (isFirstInvoice) {
                if (invoice.previousDue > 0) {
                    runningBalance += invoice.previousDue;
                }
                isFirstInvoice = false;
            }
            const discount = invoice.discount || 0;
            runningBalance += (invoice.subTotal || 0) - discount - ((invoice.paid || 0) - (invoice.totalFee || 0));
        }

        const allPayments = customerWithInvoices.payment_history || [];
        for (const p of allPayments) {
            runningBalance -= ((p.amount || 0) - (p.fee || 0));
        }

        customerWithInvoices.due = runningBalance;
        await customerWithInvoices.save();

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
