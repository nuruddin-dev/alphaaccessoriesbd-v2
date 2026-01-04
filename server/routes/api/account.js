const express = require('express');
const router = express.Router();
const Account = require('../../models/account');
const Transaction = require('../../models/transaction');
const ExpenseCategory = require('../../models/expenseCategory');
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
        const { account, amount, description, type, toAccount, transferFee } = req.body;
        // type: 'credit' (add), 'debit' (withdraw), 'transfer'

        if (!account || !amount) {
            return res.status(400).json({ error: 'Account and Amount are required.' });
        }

        const accountDoc = await Account.findById(account);
        if (!accountDoc) {
            return res.status(404).json({ error: 'Source Account not found.' });
        }

        const numAmount = Number(amount);
        const numFee = Number(transferFee) || 0;

        // Handle Transfer
        if (type === 'transfer') {
            if (!toAccount) {
                return res.status(400).json({ error: 'Destination account is required for transfer.' });
            }
            if (account === toAccount) {
                return res.status(400).json({ error: 'Source and destination accounts cannot be the same.' });
            }

            const toAccountDoc = await Account.findById(toAccount);
            if (!toAccountDoc) {
                return res.status(404).json({ error: 'Destination Account not found.' });
            }

            // Debit from Source (Amount + Fee)
            const totalDeduction = numAmount + numFee;
            accountDoc.balance -= totalDeduction;
            await accountDoc.save();

            const debitDesc = numFee > 0
                ? `Transfer to ${toAccountDoc.name} (incl. Fee: ${numFee})`
                : `Transfer to ${toAccountDoc.name}`;

            const debitTrans = new Transaction({
                account: accountDoc._id,
                amount: totalDeduction,
                type: 'debit',
                reference: 'Transfer',
                category: 'Transfer',
                description: debitDesc
            });
            await debitTrans.save();

            // Credit to Destination (Only Amount)
            toAccountDoc.balance += numAmount;
            await toAccountDoc.save();

            const creditTrans = new Transaction({
                account: toAccountDoc._id,
                amount: numAmount,
                type: 'credit',
                reference: 'Transfer',
                category: 'Transfer',
                description: `Transfer from ${accountDoc.name}`,
                relatedTransaction: debitTrans._id
            });
            await creditTrans.save();

            // Link debit to credit
            debitTrans.relatedTransaction = creditTrans._id;
            await debitTrans.save();

            return res.status(200).json({
                success: true,
                message: 'Transfer successful!',
                transaction: debitTrans, // Return the source transaction as primary confirmation
                newBalance: accountDoc.balance
            });
        }

        // Handle Standard Credit/Debit
        const transactionType = type || 'credit';

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

// @route PUT api/account/transaction/undo/:id
// @desc Undo a transaction
// @access Private
router.put('/transaction/undo/:id', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const transactionId = req.params.id;
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        if (transaction.isUndone) {
            return res.status(400).json({ error: 'Transaction is already undone.' });
        }

        const account = await Account.findById(transaction.account);
        if (!account) {
            return res.status(404).json({ error: 'Account not found.' });
        }

        // Revert Balance
        if (transaction.type === 'credit') {
            account.balance -= transaction.amount;
        } else if (transaction.type === 'debit') {
            account.balance += transaction.amount;
        }
        await account.save();

        transaction.isUndone = true;
        await transaction.save();

        // If it's a transfer, undo the related transaction as well
        if (transaction.category === 'Transfer' && transaction.relatedTransaction) {
            const relatedTrans = await Transaction.findById(transaction.relatedTransaction);
            if (relatedTrans && !relatedTrans.isUndone) {
                const relatedAccount = await Account.findById(relatedTrans.account);
                if (relatedAccount) {
                    if (relatedTrans.type === 'credit') {
                        relatedAccount.balance -= relatedTrans.amount;
                    } else if (relatedTrans.type === 'debit') {
                        relatedAccount.balance += relatedTrans.amount;
                    }
                    await relatedAccount.save();
                }
                relatedTrans.isUndone = true;
                await relatedTrans.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Transaction undone successfully!',
            newBalance: account.balance
        });
    } catch (error) {
        console.error('Undo transaction error:', error);
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route GET api/account/expense-category
// @desc Get all expense categories
// @access Private
router.get('/expense-category', auth, async (req, res) => {
    try {
        const categories = await ExpenseCategory.find({ isActive: true }).sort({ name: 1 });
        res.status(200).json({ categories });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

// @route POST api/account/expense-category/add
// @desc Add new expense category
// @access Private
router.post('/expense-category/add', auth, role.check(ROLES.Admin), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required.' });
        }

        const existingCategory = await ExpenseCategory.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this name already exists.' });
        }

        const category = new ExpenseCategory({ name, description });
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Category added successfully!',
            category
        });
    } catch (error) {
        res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
    }
});

module.exports = router;
