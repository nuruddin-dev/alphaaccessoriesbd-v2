const express = require('express');
const OrderNow = require('../../models/orderNow'); // Assuming models folder

const crypto = require('crypto');

const router = express.Router();

// POST request to create a new order
router.post('/add', async (req, res) => {
  const { name, phoneNumber, address, productName, price } = req.body;

  try {
    const newOrder = new OrderNow({
      name,
      phoneNumber,
      address,
      productName,
      price
    });

    const savedOrder = await newOrder.save();

    // Automatic entry to Steadfast Courier is disabled as per user request (manual control needed)
    // try {
    //   const { syncToSteadfast } = require('../../utils/steadfast');
    //   await syncToSteadfast({
    //     invoice: `WEB-${savedOrder._id.toString().slice(-6)}`,
    //     name: savedOrder.name,
    //     phoneNumber: savedOrder.phoneNumber,
    //     address: savedOrder.address,
    //     price: savedOrder.price,
    //     note: savedOrder.note,
    //     productName: savedOrder.productName
    //   });
    // } catch (courierError) {
    //   console.error('Failed to auto-sync to Steadfast:', courierError);
    // }

    res.json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating order' });
  }
});

router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;

  if (!newStatus) {
    return res.status(400).json({ error: 'New status is required' });
  }

  try {
    // Use findByIdAndUpdate to update the status field
    const order = await OrderNow.findByIdAndUpdate(
      id, // Use order ID
      { status: newStatus }, // Update only the status field
      { new: true } // Return the updated order
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(); // Return the updated order
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.put('/:id/note', async (req, res) => {
  const { id } = req.params;
  const { newNote } = req.body;

  if (!newNote) {
    return res.status(400).json({ error: 'New note is required' });
  }

  try {
    // Use findByIdAndUpdate to update the note field
    const order = await OrderNow.findByIdAndUpdate(
      id, // Use order ID
      { note: newNote }, // Update the note field
      { new: true } // Return the updated order
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order); // Return the updated order
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await OrderNow.find();

    res.status(200).json({
      orders
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.delete('/cancel/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // const order = await OrderNow.findOne({ _id: orderId });

    await OrderNow.deleteOne({ _id: orderId });

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

module.exports = router;
