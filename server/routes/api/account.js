const express = require('express');
const router = express.Router();
const Account = require('../../models/account');
const Transaction = require('../../models/transaction');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route GET api/account
// @desc Get all accounts
// @access Private
router.get('/', auth, async (req, res) => {
    try {
        const accounts = await Account.find({ isActive: true }).sort({ created: 1 });
        res.status(200).json({ accounts });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route POST api/account/add
// @desc Add new account
// @access Private
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, type, details, openingBalance } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Account name is required.' });
        }

        const existingAccount = await Account.findOne({ name });
        if (existingAccount) {
            return res.status(400).json({ error: 'Account with this name already exists.' });
        }

        const account = new Account({
            name,
            type,
            details,
            balance: openingBalance || 0
        });

        const savedAccount = await account.save();

        // If opening balance > 0, record a transaction
        if (openingBalance > 0) {
            const transaction = new Transaction({
                account: savedAccount._id,
                type: 'credit',
                amount: openingBalance,
                reference: 'Opening Balance',
                description: 'Initial Opening Balance'
            });
            await transaction.save();
        }

        res.status(200).json({
            success: true,
            message: 'Account added successfully!',
            account: savedAccount
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route PUT api/account/:id
// @desc Update account details
// @access Private
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, type, details } = req.body;
        const accountId = req.params.id;

        const update = { name, type, details, updated: Date.now() };

        const account = await Account.findByIdAndUpdate(accountId, update, { new: true });

        res.status(200).json({
            success: true,
            message: 'Account updated successfully!',
            account
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route POST api/account/transaction/add
// @desc Add manual transaction (Add Fund)
// @access Private
router.post('/transaction/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { account, amount, description, type } = req.body;
        // type: 'credit' (add) or 'debit' (withdraw) - default to credit for "Add Fund"

        if (!account || !amount) {
            return res.status(400).json({ error: 'Account and Amount are required.' });
        }

        const accountDoc = await Account.findById(account);
        if (!accountDoc) {
            return res.status(404).json({ error: 'Account not found.' });
        }

        const transactionType = type || 'credit';
        const numAmount = Number(amount);

        const transaction = new Transaction({
            account,
            amount: numAmount,
            type: transactionType,
            reference: 'Manual',
            category: req.body.category,
            description: description || 'Manual Transaction'
        });

        await transaction.save();

        // Update Account Balance
        if (transactionType === 'credit') {
            accountDoc.balance += numAmount;
        } else {
            accountDoc.balance -= numAmount;
        }
        await accountDoc.save();

        res.status(200).json({
            success: true,
            message: 'Transaction added successfully!',
            transaction,
            newBalance: accountDoc.balance
        });

    } catch (error) {
        console.error('Add transaction error:', error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route GET api/account/transactions
// @desc Get transaction history (all or by account)
// @access Private
router.get('/transactions', auth, async (req, res) => {
    try {
        const { startDate, endDate, account } = req.query;
        const query = {};

        if (account) {
            query.account = account;
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        } else {
            // Default to today if no date provided? Or all? 
            // Only if user requests "Today's input".
            // Let's return all limit by 100 if no date, or handle in frontend.
        }

        const transactions = await Transaction.find(query)
            .populate('account', 'name')
            .sort({ date: -1 })
            .limit(2000);

        res.status(200).json({ transactions });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

module.exports = router;
