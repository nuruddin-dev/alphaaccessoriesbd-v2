const express = require('express');
const router = express.Router();
const Invoice = require('../../models/invoice');
const Customer = require('../../models/customer');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

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

    const invoice = await Invoice.findById(invoiceId);
    // .populate('invoiceNumber', 'invoiceNumber')
    // .populate('created', 'created');

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
      .populate('customer', 'name phoneNumber due');

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
      notes,
      isWholesale
    } = req.body;

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

    // Create new invoice
    const invoice = new Invoice({
      invoiceNumber,
      createdBy,
      customer,
      customerName,
      customerPhone,
      items,
      subTotal,
      previousDue: previousDue || 0,
      discount: discount || 0,
      grandTotal,
      paid: paid || 0,
      due: due || 0,
      paymentMethod: paymentMethod || 'cash',
      notes,
      isWholesale: isWholesale
    });

    const savedInvoice = await invoice.save();

    // Update customer's purchase history and due amount if a customer is associated
    if (customer) {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        if (!customerDoc.purchase_history) {
          customerDoc.purchase_history = [];
        }
        customerDoc.purchase_history.push(savedInvoice._id);
        customerDoc.due = due; // Update the customer's due amount
        await customerDoc.save();
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

    // Get the previous customer to update their data
    const previousCustomerId = existingInvoice.customer;
    const newCustomerId = update.customer;

    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, update, {
      new: true
    });

    // If customer has changed, update both customers' purchase histories and due amounts
    if (
      newCustomerId &&
      previousCustomerId &&
      newCustomerId.toString() !== previousCustomerId.toString()
    ) {
      // Remove invoice from previous customer's history
      await Customer.findByIdAndUpdate(previousCustomerId, {
        $pull: { purchase_history: invoiceId },
        $inc: { due: -existingInvoice.due } // Reduce the previous due
      });

      // Add invoice to new customer's history
      await Customer.findByIdAndUpdate(newCustomerId, {
        $addToSet: { purchase_history: invoiceId },
        $inc: { due: update.due || 0 } // Add the new due
      });
    }
    // If customer hasn't changed but due amount has
    else if (
      previousCustomerId &&
      update.due !== undefined &&
      update.due !== existingInvoice.due
    ) {
      const dueDifference = update.due - existingInvoice.due;
      await Customer.findByIdAndUpdate(previousCustomerId, {
        $inc: { due: dueDifference }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice has been updated successfully!',
      invoice: updatedInvoice
    });
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

    // If this invoice is associated with a customer, update the customer
    if (invoice.customer) {
      await Customer.findByIdAndUpdate(invoice.customer, {
        $pull: { purchase_history: invoiceId },
        $inc: { due: -invoice.due } // Reduce the customer's due amount
      });
    }

    await Invoice.deleteOne({ _id: invoiceId });

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
    });

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
