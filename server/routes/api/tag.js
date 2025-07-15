const express = require('express');
const router = express.Router();

// Bring in Models & Utils
const Tag = require('../../models/tag');
const Product = require('../../models/product');
const Merchant = require('../../models/merchant');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const store = require('../../utils/store');
const { ROLES, MERCHANT_STATUS } = require('../../constants');

router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const name = req.body.name;
    const description = req.body.description;
    const isActive = req.body.isActive;

    if (!description || !name) {
      return res
        .status(400)
        .json({ error: 'You must enter description & name.' });
    }

    const tag = new Tag({
      name,
      description,
      isActive
    });

    const tagDoc = await tag.save();

    res.status(200).json({
      success: true,
      message: `Tag has been added successfully!`,
      tag: tagDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch store tags api
router.get('/list', async (req, res) => {
  try {
    const tags = await Tag.find({
      isActive: true
    }).populate('merchant', 'name');

    res.status(200).json({
      tags
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch tags api
router.get(
  '/',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      let tags = null;

      if (req.user.merchant) {
        tags = await Tag.find({
          merchant: req.user.merchant
        }).populate('merchant', 'name');
      } else {
        tags = await Tag.find({}).populate('merchant', 'name');
      }

      res.status(200).json({
        tags
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const tagId = req.params.id;

    const tagDoc = await Tag.findOne({ _id: tagId }).populate(
      'merchant',
      '_id'
    );

    if (!tagDoc) {
      return res.status(404).json({
        message: `Cannot find tag with the id: ${tagId}.`
      });
    }

    res.status(200).json({
      tag: tagDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.get(
  '/list/select',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      let tags = null;

      if (req.user.merchant) {
        tags = await Tag.find(
          {
            merchant: req.user.merchant
          },
          'name'
        );
      } else {
        tags = await Tag.find({}, 'name');
      }

      res.status(200).json({
        tags
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

router.put(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const tagId = req.params.id;
      const update = req.body.tag;
      const query = { _id: tagId };
      const { slug } = req.body.tag;

      const foundTag = await Tag.findOne({
        $or: [{ slug }]
      });

      if (foundTag && foundTag._id != tagId) {
        return res.status(400).json({ error: 'Slug is already in use.' });
      }

      await Tag.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Tag has been updated successfully!'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

router.put(
  '/:id/active',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const tagId = req.params.id;
      const update = req.body.tag;
      const query = { _id: tagId };

      // disable tag(tagId) products
      if (!update.isActive) {
        const products = await Product.find({ tag: tagId });
        store.disableProducts(products);
      }

      await Tag.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Tag has been updated successfully!'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin),
  async (req, res) => {
    try {
      const tagId = req.params.id;
      await deactivateMerchant(tagId);
      const tag = await Tag.deleteOne({ _id: tagId });

      res.status(200).json({
        success: true,
        message: `Tag has been deleted successfully!`,
        tag
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

const deactivateMerchant = async tagId => {
  const tagDoc = await Tag.findOne({ _id: tagId }).populate('merchant', '_id');
  if (!tagDoc || !tagDoc.merchant) return;
  const merchantId = tagDoc.merchant._id;
  const query = { _id: merchantId };
  const update = {
    status: MERCHANT_STATUS.Waiting_Approval,
    isActive: false,
    tag: null
  };
  return await Merchant.findOneAndUpdate(query, update, {
    new: true
  });
};

module.exports = router;
