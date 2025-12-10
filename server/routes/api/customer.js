const express = require('express');
const router = express.Router();
const Customer = require('../../models/customer');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// @route GET api/customer
// @desc Get all customers
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching all customers...');
    const customers = await Customer.find().sort({ created: -1 });
    res.status(200).json({
      customers
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route GET api/customer/:id
// @desc Get a specific customer
// @access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId).populate(
      'purchase_history'
    );

    if (!customer) {
      return res.status(404).json({
        message: 'No customer found.'
      });
    }

    res.status(200).json({
      customer
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route GET api/customer/search/name/:name
// @desc Search customers by name
// @access Private
router.get('/search/name/:name', auth, async (req, res) => {
  try {
    const name = req.params.name;
    const customers = await Customer.find({
      name: { $regex: name, $options: 'i' }
    });

    if (customers.length === 0) {
      return res.status(404).json({
        message: 'No customers found with that name.'
      });
    }

    res.status(200).json({
      customers
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route GET api/customer/search/phone/:phoneNumber
// @desc Search customers by phone number
// @access Private
router.get('/search/phone/:phoneNumber', auth, async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    const customers = await Customer.find({
      phoneNumber: { $regex: phoneNumber, $options: 'i' }
    });

    if (customers.length === 0) {
      return res.status(404).json({
        message: 'No customers found with that phone number.'
      });
    }

    res.status(200).json({
      customers
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route POST api/customer/add
// @desc Add customer
// @access Private
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { name, phoneNumber, address, invoiceId, due } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'You must enter a name.' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: 'You must enter a phone number.' });
    }

    // Check if customer with same phone number already exists
    const existingCustomer = await Customer.findOne({ phoneNumber });
    if (existingCustomer) {
      return res
        .status(400)
        .json({ error: 'This phone number is already in use.' });
    }

    const customer = new Customer({
      name,
      phoneNumber,
      address,
      due: due || 0,
      purchase_history: invoiceId ? [invoiceId] : []
    });

    const savedCustomer = await customer.save();

    res.status(200).json({
      success: true,
      message: `Customer has been added successfully!`,
      customer: savedCustomer
    });
  } catch (error) {
    return res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// @route PUT api/customer/:id
// @desc Update customer
// @access Private
router.put(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const customerId = req.params.id;
      const update = req.body;

      // Don't let the user modify the purchase_history directly from this endpoint
      // That should be managed when creating/updating invoices
      if (update.purchase_history) {
        delete update.purchase_history;
      }

      const existingCustomer = await Customer.findById(customerId);

      if (!existingCustomer) {
        return res.status(404).json({
          message: 'No customer found.'
        });
      }

      // If phone number is being changed, check that it's not already in use
      if (
        update.phoneNumber &&
        update.phoneNumber !== existingCustomer.phoneNumber
      ) {
        const phoneExists = await Customer.findOne({
          phoneNumber: update.phoneNumber
        });
        if (phoneExists) {
          return res
            .status(400)
            .json({ error: 'This phone number is already in use.' });
        }
      }

      const updatedCustomer = await Customer.findByIdAndUpdate(
        customerId,
        update,
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Customer has been updated successfully!',
        customer: updatedCustomer
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// @route DELETE api/customer/:id
// @desc Delete customer
// @access Private
router.delete('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        message: 'No customer found.'
      });
    }

    await Customer.deleteOne({ _id: customerId });

    res.status(200).json({
      success: true,
      message: 'Customer has been deleted successfully!'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});



module.exports = router;
