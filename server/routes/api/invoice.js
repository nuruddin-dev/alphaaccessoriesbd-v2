const express = require('express');
const router = express.Router();
const Invoice = require('../../models/invoice');
const Customer = require('../../models/customer');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');
const Account = require('../../models/account');
const Transaction = require('../../models/transaction');

// @route GET api/invoice
// @desc Get all invoices
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      console.log('Filtering invoices from', startDate, 'to', endDate);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      console.log('Query range:', start, 'to', end);

      query.created = {
        $gte: start,
        $lte: end
      };
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name phoneNumber')
      .populate('payments.account', 'name')
      .sort({ created: -1 });

    res.status(200).json({
      invoices
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route GET api/invoice/:id
// @desc Get invoice by id
// @access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await Invoice.findById(invoiceId)
      .populate('customer', 'name phoneNumber due')
      .populate('payments.account', 'name');

    if (!invoice) {
      return res.status(404).json({
        message: 'No invoice found.'
      });
    }

    res.status(200).json({
      invoice
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route GET api/invoice/number/:invoiceNumber
// @desc Get invoice by invoice number
// @access Private
router.get('/number/:invoiceNumber', auth, async (req, res) => {
  try {
    const invoiceNumber = req.params.invoiceNumber;

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('customer', 'name phoneNumber due')
      .populate('payments.account', 'name');

    if (!invoice) {
      return res.status(404).json({
        message: 'No invoice found with that invoice number.'
      });
    }

    res.status(200).json({
      invoice
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route POST api/invoice/create
// @desc Create invoice
// @access Private
router.post('/create', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const {
      invoiceNumber,
      createdBy,
      customer,
      customerName,
      customerPhone,
      items,
      subTotal,
      previousDue,
      discount,
      grandTotal,
      paid,
      due,
      paymentMethod,
      payments, // NEW: Array of { account, amount }
      notes,
      isWholesale
    } = req.body;

    const calculatedTotalFee = payments ? payments.reduce((sum, p) => sum + (Number(p.fee) || 0), 0) : 0;

    // Validation
    if (!invoiceNumber) {
      return res
        .status(400)
        .json({ error: 'You must enter an invoice number.' });
    }

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res
        .status(400)
        .json({ error: 'This invoice number already exists.' });
    }

    // Enrich items with buyingPrice from the database
    const enrichedItems = await Promise.all(items.map(async (item) => {
      let buyingPrice = 0;
      if (item.product) {
        const productDoc = await Product.findById(item.product);
        if (productDoc) {
          buyingPrice = productDoc.buyingPrice || 0;
        }
      }

      const quantity = item.quantity ? Number(item.quantity) : 0;
      const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
      const totalPrice = quantity * unitPrice;

      return {
        ...item,
        buyingPrice,
        totalPrice
      };
    }));

    // Recalculate item totalPrice to ensure consistency (quantity * unitPrice)
    // But use the frontend values for subTotal, grandTotal, and due
    const calculatedSubTotal = enrichedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    // Create new invoice - use frontend values for grandTotal and due
    const invoice = new Invoice({
      invoiceNumber,
      createdBy,
      customer,
      customerName,
      customerPhone,
      items: enrichedItems,
      subTotal: subTotal || calculatedSubTotal,
      previousDue: previousDue || 0,
      discount: discount || 0,
      grandTotal: grandTotal, // Use frontend value
      paid: paid || 0,
      due: due, // Use frontend value
      due: due, // Use frontend value
      paymentMethod: paymentMethod || 'cash',
      payments: payments || [], // Save payments array
      totalFee: calculatedTotalFee,
      notes,
      isWholesale: isWholesale
    });

    const savedInvoice = await invoice.save();

    // Update customer's purchase history and recalculate due amount if a customer is associated
    if (customer) {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        if (!customerDoc.purchase_history) {
          customerDoc.purchase_history = [];
        }
        customerDoc.purchase_history.push(savedInvoice._id);
        await customerDoc.save();

        // Recalculate customer's due based on ledger calculation
        await recalculateCustomerDue(customer);
      }
    } else if (customerName && customerPhone) {
      // Create a new customer if customer details are provided but no customer ID
      const newCustomer = new Customer({
        name: customerName,
        phoneNumber: customerPhone,
        purchase_history: [savedInvoice._id],
        due: due || 0
      });

      const savedCustomer = await newCustomer.save();

      // Update the invoice with the new customer ID
      savedInvoice.customer = savedCustomer._id;
      await savedInvoice.save();

      // Include the customer in the response
      savedInvoice.customer = savedCustomer;
    }

    res.status(200).json({
      success: true,
      message: `Invoice has been created successfully!`,
      invoice: savedInvoice
    });

    // Update product stock
    await updateProductStock(enrichedItems, 'add');

    // Handle Account Payments (New System)
    if (payments && payments.length > 0) {
      for (const p of payments) {
        if (p.amount > 0 && p.account) {
          const acc = await Account.findById(p.account);
          if (acc) {
            acc.balance += Number(p.amount);
            await acc.save();

            const trans = new Transaction({
              account: acc._id,
              type: 'credit',
              amount: p.amount,
              reference: `Invoice #${savedInvoice.invoiceNumber}`,
              referenceId: savedInvoice._id,
              description: `Payment for Invoice #${savedInvoice.invoiceNumber}`,
              date: savedInvoice.created
            });
            await trans.save();
          }
        }
      }
    }

  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route PUT api/invoice/:id
// @desc Update invoice
// @access Private
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const update = req.body;

    const existingInvoice = await Invoice.findById(invoiceId);

    if (!existingInvoice) {
      return res.status(404).json({
        message: 'No invoice found.'
      });
    }

    // Check if invoice number is being changed and if it already exists
    if (
      update.invoiceNumber &&
      update.invoiceNumber !== existingInvoice.invoiceNumber
    ) {
      const invoiceExists = await Invoice.findOne({
        invoiceNumber: update.invoiceNumber
      });
      if (invoiceExists) {
        return res
          .status(400)
          .json({ error: 'This invoice number is already in use.' });
      }
    }

    // --- Customer Handling Logic Start ---
    const { customerName, customerPhone } = update;
    let finalCustomerId = update.customer; // Start with the ID provided in payload (if any)

    // Case 1: No Customer ID provided, but Name/Phone are present.
    // Create new customer and assign.
    if (!finalCustomerId && customerName && customerPhone) {
      const newCustomer = new Customer({
        name: customerName,
        phoneNumber: customerPhone,
        purchase_history: [], // Will be added later
        due: 0 // Will be calculated later
      });
      const savedCustomer = await newCustomer.save();
      finalCustomerId = savedCustomer._id;
    }
    // Case 2: Customer ID provided, but Name/Phone mismatch (User wants to switch/create)
    else if (finalCustomerId && (customerName || customerPhone)) {
      const currentPayloadCustomer = await Customer.findById(finalCustomerId);
      if (currentPayloadCustomer) {
        const nameMismatch = customerName && customerName.trim() !== currentPayloadCustomer.name;
        const phoneMismatch = customerPhone && customerPhone.trim() !== currentPayloadCustomer.phoneNumber;

        if (nameMismatch || phoneMismatch) {
          // Check if a customer exists with the NEW details (Phone number key)
          let existingTargetCustomer = await Customer.findOne({ phoneNumber: customerPhone });

          if (existingTargetCustomer) {
            // Found existing customer, switch to them
            finalCustomerId = existingTargetCustomer._id;
          } else {
            // Create new customer with new details
            const newCustomer = new Customer({
              name: customerName,
              phoneNumber: customerPhone,
              purchase_history: [],
              due: 0
            });
            const savedCustomer = await newCustomer.save();
            finalCustomerId = savedCustomer._id;
          }
        }
      }
    }

    // Update the 'update' object with the determined customer ID
    update.customer = finalCustomerId;

    // Get the previous customer (from the existing invoice in DB)
    const previousCustomerId = existingInvoice.customer;
    const newCustomerId = finalCustomerId; // This is now the definitive Data-Base ID

    // --- Customer Handling Logic End ---

    // Enrich items with buyingPrice logic
    if (update.items && update.items.length > 0) {
      // Revert stock changes from the previous invoice state
      await updateProductStock(existingInvoice.items, 'remove');

      const enrichedItems = await Promise.all(update.items.map(async (item) => {
        // If item has a valid buying price (snapshot exists), keep it.
        if (item.buyingPrice && item.buyingPrice > 0) {
          return item;
        }

        // If buyingPrice is 0 or missing (old invoice or new item), fetch current price.
        let buyingPrice = 0;
        let productDoc = null;

        if (item.product) {
          try {
            productDoc = await Product.findById(item.product);
          } catch (e) {
            console.log('Invalid product ID:', item.product);
          }
        }

        // Fallback: Try to find by name if product ID is missing or not found
        if (!productDoc && item.productName) {
          productDoc = await Product.findOne({
            $or: [
              { shortName: item.productName },
              { name: item.productName }
            ]
          });

          // If found, link the product ID to the invoice item
          if (productDoc) {
            item.product = productDoc._id;
          }
        }

        if (productDoc) {
          buyingPrice = productDoc.buyingPrice || 0;
        }

        const quantity = item.quantity ? Number(item.quantity) : 0;
        const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
        const totalPrice = quantity * unitPrice;

        return {
          ...item,
          buyingPrice,
          totalPrice
        };
      }));
      update.items = enrichedItems;

      // Use subTotal from frontend, or calculate from items as fallback
      const calculatedSubTotal = enrichedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      if (update.subTotal === undefined) {
        update.subTotal = calculatedSubTotal;
      }
      // grandTotal and due should come from frontend - don't recalculate

      // Apply stock changes for the updated invoice state
      await updateProductStock(enrichedItems, 'add');
    }

    // Calculate totalFee from payments if present in update, otherwise keep existing
    if (update.payments) {
      update.totalFee = update.payments.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);
    }

    // Handle Payment Updates
    // If payments are present in the update, full replacement of payment transactions is assumed
    if (update.payments) {
      // 1. Revert old transactions
      const oldTransactions = await Transaction.find({ referenceId: invoiceId });
      for (const trans of oldTransactions) {
        const acc = await Account.findById(trans.account);
        if (acc) {
          if (trans.type === 'credit') {
            acc.balance -= trans.amount;
          } else {
            acc.balance += trans.amount;
          }
          await acc.save();
        }
        await Transaction.deleteOne({ _id: trans._id });
      }

      // 2. Apply new payments
      if (update.payments.length > 0) {
        for (const p of update.payments) {
          if (p.amount > 0 && p.account) {
            const acc = await Account.findById(p.account);
            if (acc) {
              acc.balance += Number(p.amount);
              await acc.save();

              const trans = new Transaction({
                account: acc._id,
                type: 'credit',
                amount: p.amount,
                reference: `Invoice #${existingInvoice.invoiceNumber}`,
                referenceId: invoiceId,
                description: `Payment for Invoice #${existingInvoice.invoiceNumber}`,
                date: Date.now()
              });
              await trans.save();
            }
          }
        }
      }
    }

    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, update, {
      new: true
    });

    // If customer has changed, update both customers' purchase histories and recalculate dues
    if (
      newCustomerId &&
      previousCustomerId &&
      newCustomerId.toString() !== previousCustomerId.toString()
    ) {
      // Remove invoice from previous customer's history
      await Customer.findByIdAndUpdate(previousCustomerId, {
        $pull: { purchase_history: invoiceId }
      });

      // Add invoice to new customer's history
      await Customer.findByIdAndUpdate(newCustomerId, {
        $addToSet: { purchase_history: invoiceId }
      });

      // Recalculate both customers' dues
      await recalculateCustomerDue(previousCustomerId);
      await recalculateCustomerDue(newCustomerId);
    }
    // If only new customer exists (was null before), add logic to add invoice and recalculate
    else if (newCustomerId && !previousCustomerId) {
      await Customer.findByIdAndUpdate(newCustomerId, {
        $addToSet: { purchase_history: invoiceId }
      });
      await recalculateCustomerDue(newCustomerId);
    }
    // If customer hasn't changed, just recalculate their due
    else if (previousCustomerId) {
      await recalculateCustomerDue(previousCustomerId);
    }

    res.status(200).json({
      success: true,
      message: 'Invoice has been updated successfully!',
      invoice: updatedInvoice
    });

    // Apply stock changes for the updated invoice state
    // Use enrichedItems if available (items were updated), otherwise use existing items (if items weren't in payload)
    // But wait, if items weren't in payload, we shouldn't have reverted them?
    // The current logic assumes 'items' is always sent in update or we handle it.
    // Looking at the code: if (update.items && update.items.length > 0) ...
    // If update.items is missing, we shouldn't revert/apply.
    // However, the revert block above runs unconditionally.
    // We should only revert/apply if items are being updated.
    // Let's fix this logic in the helper function or call site.
    // For now, let's assume items are always sent or we need to fetch them if not.
    // Actually, if items are NOT in the update payload, we shouldn't touch stock.
    // But I already added the revert call above unconditionally.
    // I should move the revert call inside the `if (update.items ...)` block.

  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route DELETE api/invoice/:id
// @desc Delete invoice
// @access Private
router.delete('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        message: 'No invoice found.'
      });
    }

    // Revert stock changes
    await updateProductStock(invoice.items, 'remove');

    // Revert Payment Transactions
    const transactions = await Transaction.find({ referenceId: invoiceId });
    for (const trans of transactions) {
      const acc = await Account.findById(trans.account);
      if (acc) {
        if (trans.type === 'credit') {
          acc.balance -= trans.amount;
        } else {
          acc.balance += trans.amount;
        }
        await acc.save();
      }
      await Transaction.deleteOne({ _id: trans._id });
    }

    // If this invoice is associated with a customer, update the customer
    if (invoice.customer) {
      const customerId = invoice.customer;
      await Customer.findByIdAndUpdate(customerId, {
        $pull: { purchase_history: invoiceId }
      });

      // Delete the invoice first, then recalculate
      await Invoice.deleteOne({ _id: invoiceId });

      // Recalculate customer's due
      await recalculateCustomerDue(customerId);
    } else {
      await Invoice.deleteOne({ _id: invoiceId });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice has been deleted successfully!'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route GET api/invoice/customer/:customerId
// @desc Get all invoices for a specific customer
// @access Private
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const invoices = await Invoice.find({ customer: customerId })
      .populate('customer', 'name phoneNumber due')
      .populate('payments.account', 'name')
      .sort({ created: -1 });

    res.status(200).json({
      invoices
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.get('/invoice/:number', async (req, res) => {
  try {
    const invoiceNumber = req.params.number;

    const invoice = await Invoice.findOne({
      invoiceNumber
    }).populate('customer', 'name phoneNumber due')
      .populate('payments.account', 'name');

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

const updateProductStock = async (items, operation) => {
  if (!items || items.length === 0) return;

  const bulkOps = items.map(item => {
    // If operation is 'add' (invoice created/updated), we subtract quantity from stock.
    // If operation is 'remove' (invoice deleted/reverted), we add quantity to stock.
    // Note: item.quantity can be negative (return).
    // If item.quantity is -5 (return 5 items), and we 'add' invoice: stock -= -5 => stock += 5. Correct.
    // If item.quantity is -5 (return 5 items), and we 'remove' invoice: stock += -5 => stock -= 5. Correct.

    const quantity = Number(item.quantity);
    const adjustment = operation === 'add' ? -quantity : quantity;

    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: adjustment } }
      }
    };
  });

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
  }
};

/**
 * Recalculates a customer's due amount based on all their invoices and payments.
 * This ensures the customer's due field always matches the ledger's running balance.
 */
const recalculateCustomerDue = async (customerId) => {
  if (!customerId) return;

  try {
    const customerWithInvoices = await Customer.findById(customerId)
      .populate({
        path: 'purchase_history',
        select: 'subTotal previousDue discount paid totalFee created'
      });

    if (!customerWithInvoices) return;

    // Calculate running balance using the same logic as ledger endpoint
    let runningBalance = 0;
    let isFirstInvoice = true;

    // Sort invoices by date
    const sortedInvoices = (customerWithInvoices.purchase_history || [])
      .filter(inv => inv)
      .sort((a, b) => new Date(a.created || 0) - new Date(b.created || 0));

    // Calculate balance from invoices
    for (const invoice of sortedInvoices) {
      // For the first invoice, include previousDue as opening balance
      if (isFirstInvoice) {
        if (invoice.previousDue > 0) {
          runningBalance += invoice.previousDue;
        }
        isFirstInvoice = false;
      }

      // New amount from this invoice = subTotal - discount - (paid - totalFee)
      const discount = invoice.discount || 0;
      const netPaid = (invoice.paid || 0) - (invoice.totalFee || 0);
      const newAmount = (invoice.subTotal || 0) - discount - netPaid;
      runningBalance += newAmount;
    }

    // Subtract all payments
    const allPayments = customerWithInvoices.payment_history || [];
    for (const payment of allPayments) {
      runningBalance -= payment.amount || 0;
    }

    // Update customer's due to match ledger balance
    customerWithInvoices.due = runningBalance;
    await customerWithInvoices.save();
  } catch (error) {
    console.error('Error recalculating customer due:', error);
  }
};
