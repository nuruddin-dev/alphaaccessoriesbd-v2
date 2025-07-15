const express = require('express');
const router = express.Router();

const User = require('../../models/user');

// Bring in Models & Helpers
const Address = require('../../models/address');
const auth = require('../../middleware/auth');

// add address api
router.post('/add', auth, async (req, res) => {
  try {
    const user = req.user;

    const address = new Address({
      ...req.body,
      user: user._id
    });
    const addressDoc = await address.save();

    res.status(200).json({
      success: true,
      message: `Address has been added successfully!`,
      address: addressDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch all addresses api
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id });

    res.status(200).json({
      addresses
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const addressId = req.params.id;

    const addressDoc = await Address.findOne({ _id: addressId });

    if (!addressDoc) {
      res.status(404).json({
        message: `Cannot find Address with the id: ${addressId}.`
      });
    }

    res.status(200).json({
      address: addressDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const addressId = req.params.id;
    const update = req.body;
    const query = { _id: addressId };

    await Address.findOneAndUpdate(query, update, {
      new: true
    });

    res.status(200).json({
      success: true,
      message: 'Address has been updated successfully!'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.put('/user', auth, async (req, res) => {
  const newCity = req.body.updateData.city;
  try {
    // Update the user's city field only, keeping other fields unchanged
    await User.updateOne({}, { $set: { city: newCity } });

    res.json({ message: 'User city updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id; // Extract the user ID from the request URL
    const updateData = req.body; // Get the update data from the request body

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the city field only, keeping other fields unchanged
    user.city = updateData.city;

    // Save the updated user document
    await user.save();

    // Respond with the updated user document
    res.json({ message: 'User city updated successfully', user: user });
  } catch (error) {
    res.status(400).json({
      error: 'User city can not be updated. Please try again.'
    });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const address = await Address.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: `Address has been deleted successfully!`,
      address
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

module.exports = router;
