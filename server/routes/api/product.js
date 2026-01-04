const express = require('express');
const router = express.Router();
const multer = require('multer');
const Mongoose = require('mongoose');

// Bring in Models & Utils
const Product = require('../../models/product');
const Brand = require('../../models/brand');
const Tag = require('../../models/tag');
const Category = require('../../models/category');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const checkAuth = require('../../utils/auth');
const { s3Upload } = require('../../utils/storage');
const {
  getStoreProductsQuery,
  getStoreProductsWishListQuery
} = require('../../utils/queries');
const { ROLES } = require('../../constants');

const storage = multer.memoryStorage();
const upload = multer({ storage });
const apicache = require('apicache');
const cache = apicache.middleware;

// fetch product slug api
router.get('/item/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const productDoc = await Product.findOne({ slug, isActive: true })
      .populate({
        path: 'brand',
        select: 'name isActive slug'
      })
      .populate({
        path: 'tags',
        select: 'name isActive slug'
      });

    const hasNoBrand =
      productDoc?.brand === null || productDoc?.brand?.isActive === false;

    if (!productDoc || hasNoBrand) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    res.status(200).json({
      product: productDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch storefront products api
router.get('/storefront', cache('5 minutes'), async (req, res) => {
  try {
    const popular = await Product.find({ isActive: true, popular: true })
      .limit(14)
      .sort('-created');
    const premium = await Product.find({ isActive: true, premium: true })
      .limit(14)
      .sort('-created');
    const newArrivals = await Product.find({ isActive: true })
      .sort('-created')
      .limit(14);

    res.status(200).json({
      popular,
      premium,
      new: newArrivals
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch product name search api
router.get('/list/search/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const searchRegex = new RegExp(name, 'is');

    // Search in both name and shortName fields
    const productDoc = await Product.find(
      {
        $or: [
          { name: { $regex: searchRegex } },
          { shortName: { $regex: searchRegex } }
        ],
        isActive: true
      },
      { name: 1, shortName: 1, slug: 1, imageUrl: 1, price: 1, buyingPrice: 1, wholeSellPrice: 1, quantity: 1, _id: 1 }
    ).limit(50); // Limit results for performance

    if (productDoc.length < 0) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    res.status(200).json({
      products: productDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch product list for selection (dropdowns)
router.get('/list/select', auth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }, 'name sku shortName price buyingPrice quantity');
    res.status(200).json({
      products
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch store products by advanced filters api
router.get('/list', async (req, res) => {
  try {
    let {
      sortOrder,
      rating,
      max,
      min,
      category,
      page = 1,
      limit = 20
    } = req.query;
    sortOrder = JSON.parse(sortOrder);

    const categoryFilter = category ? { category } : {};
    const basicQuery = getStoreProductsQuery(min, max, rating);

    const userDoc = await checkAuth(req);
    const categoryDoc = await Category.findOne(
      { slug: categoryFilter.category, isActive: true },
      'products -_id'
    );

    if (categoryDoc && categoryFilter !== category) {
      basicQuery.push({
        $match: {
          isActive: true,
          _id: {
            $in: Array.from(categoryDoc.products)
          }
        }
      });
    }

    let products = null;
    const productsCount = await Product.aggregate(basicQuery);
    const count = productsCount.length;
    const size = count > limit ? page - 1 : 0;
    const currentPage = count > limit ? Number(page) : 1;

    // paginate query
    const paginateQuery = [
      { $sort: sortOrder },
      { $skip: size * limit },
      { $limit: limit * 1 }
    ];

    if (userDoc) {
      const wishListQuery = getStoreProductsWishListQuery(userDoc.id).concat(
        basicQuery
      );
      products = await Product.aggregate(wishListQuery.concat(paginateQuery));
    } else {
      products = await Product.aggregate(basicQuery.concat(paginateQuery));
    }

    res.status(200).json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage,
      count
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch store products by brand api
router.get('/list/brand/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const brand = await Brand.findOne({ slug, isActive: true });

    if (!brand) {
      return res.status(404).json({
        message: `Cannot find brand with the slug: ${slug}.`
      });
    }

    const userDoc = await checkAuth(req);

    if (userDoc) {
      const products = await Product.aggregate([
        {
          $match: {
            isActive: true,
            brand: brand._id
          }
        },
        {
          $lookup: {
            from: 'wishlists',
            let: { product: '$_id' },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ['$$product', '$product'] } },
                    { user: new Mongoose.Types.ObjectId(userDoc.id) }
                  ]
                }
              }
            ],
            as: 'isLiked'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brands'
          }
        },
        {
          $addFields: {
            isLiked: { $arrayElemAt: ['$isLiked.isLiked', 0] }
          }
        },
        {
          $unwind: '$brands'
        },
        {
          $addFields: {
            'brand.name': '$brands.name',
            'brand._id': '$brands._id',
            'brand.isActive': '$brands.isActive'
          }
        },
        { $project: { brands: 0 } }
      ]);

      res.status(200).json({
        products: products.reverse(),
        page: 1,
        pages: products.length > 0 ? Math.ceil(products.length / 8) : 0,
        totalProducts: products.length
      });
    } else {
      const products = await Product.find({
        brand: brand._id,
        isActive: true
      }).populate('brand', 'name');

      res.status(200).json({
        products: products.reverse(),
        page: 1,
        pages: products.length > 0 ? Math.ceil(products.length / 8) : 0,
        totalProducts: products.length
      });
    }
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch store products by category api
router.get('/list/category/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const category = await Category.findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        message: `Cannot find category with the slug: ${slug}.`
      });
    }

    const userDoc = await checkAuth(req);

    if (userDoc) {
      const products = await Product.aggregate([
        {
          $match: {
            isActive: true,
            category: category._id
          }
        },
        {
          $lookup: {
            from: 'wishlists',
            let: { product: '$_id' },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ['$$product', '$product'] } },
                    { user: new Mongoose.Types.ObjectId(userDoc.id) }
                  ]
                }
              }
            ],
            as: 'isLiked'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brands'
          }
        },
        {
          $addFields: {
            isLiked: { $arrayElemAt: ['$isLiked.isLiked', 0] }
          }
        },
        {
          $unwind: '$brands'
        },
        {
          $addFields: {
            'brand.name': '$brands.name'
          }
        },
        { $project: { categories: 0 } }
      ]);

      res.status(200).json({
        products: products,
        page: 1,
        pages: products.length > 0 ? Math.ceil(products.length / 8) : 0,
        totalProducts: products.length
      });
    } else {
      const products = await Product.find({
        category: category._id,
        isActive: true
      }).populate('category', 'name');

      res.status(200).json({
        products: products,
        page: 1,
        pages: products.length > 0 ? Math.ceil(products.length / 8) : 0,
        totalProducts: products.length
      });
    }
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch store products by tag api
router.get('/list/tag/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const tag = await Tag.findOne({ slug, isActive: true });

    if (!tag) {
      return res.status(404).json({
        message: `Cannot find Tag with the slug: ${slug}.`
      });
    }

    const userDoc = await checkAuth(req);

    if (userDoc) {
      const products = await Product.aggregate([
        {
          $match: {
            isActive: true,
            tag: tag._id
          }
        },
        {
          $lookup: {
            from: 'wishlists',
            let: { product: '$_id' },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ['$$product', '$product'] } },
                    { user: new Mongoose.Types.ObjectId(userDoc.id) }
                  ]
                }
              }
            ],
            as: 'isLiked'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brands'
          }
        },
        {
          $addFields: {
            isLiked: { $arrayElemAt: ['$isLiked.isLiked', 0] }
          }
        },
        {
          $unwind: '$brands'
        },
        {
          $addFields: {
            'brand.name': '$brands.name'
          }
        },
        { $project: { categories: 0 } }
      ]);

      res.status(200).json({
        products: products,
        page: 1,
        pages: products.length > 0 ? Math.ceil(products.length / 8) : 0,
        totalProducts: products.length
      });
    } else {
      const products = await Product.find({
        tag: tag._id,
        isActive: true
      }).populate('tag', 'name');

      res.status(200).json({
        products: products,
        page: 1,
        pages: products.length > 0 ? Math.ceil(products.length / 8) : 0,
        totalProducts: products.length
      });
    }
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// add product api
router.post(
  '/add',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  upload.single('image'),
  async (req, res) => {
    try {
      const shortName = req.body.shortName;

      // Only shortName is required
      if (!shortName) {
        return res.status(400).json({ error: 'You must enter short name.' });
      }

      // Generate SKU if not provided (shortName + timestamp)
      const sku = req.body.sku || `${shortName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

      // Check if SKU already exists
      const foundProduct = await Product.findOne({ sku });
      if (foundProduct) {
        return res.status(400).json({ error: 'This sku is already in use.' });
      }

      // Set defaults for other fields
      const name = req.body.name || shortName;
      const description = req.body.description || '';
      const quantity = req.body.quantity || 0;
      const previousPrice = req.body.previousPrice || 0;
      const price = req.body.price || 0;
      const buyingPrice = req.body.buyingPrice || 0;
      const wholeSellPrice = req.body.wholeSellPrice || 0;
      const history = req.body.history ? JSON.parse(req.body.history) : [];
      const popular = req.body.popular || false;
      const premium = req.body.premium || false;

      // Parse JSON strings for object references with safe null handling
      let brand = null;
      if (req.body.brand && req.body.brand !== 'null' && req.body.brand !== 'undefined') {
        try {
          const parsedBrand = JSON.parse(req.body.brand);
          brand = Array.isArray(parsedBrand) ? parsedBrand[0] : parsedBrand;
        } catch (e) {
          brand = null;
        }
      }

      let category = null;
      if (req.body.category && req.body.category !== 'null' && req.body.category !== 'undefined') {
        try {
          const parsedCategory = JSON.parse(req.body.category);
          category = Array.isArray(parsedCategory) ? parsedCategory[0] : parsedCategory;
        } catch (e) {
          category = null;
        }
      }

      // Parse and flatten tags array with safe null handling
      let tags = [];
      if (req.body.tags && req.body.tags !== 'null' && req.body.tags !== 'undefined') {
        try {
          const parsedTags = JSON.parse(req.body.tags);
          tags = Array.isArray(parsedTags[0]) ? parsedTags[0] : (Array.isArray(parsedTags) ? parsedTags : []);
        } catch (e) {
          tags = [];
        }
      }

      // Parse colors array with safe null handling
      let colors = [];
      if (req.body.colors && req.body.colors !== 'null' && req.body.colors !== 'undefined') {
        try {
          const parsedColors = JSON.parse(req.body.colors);
          colors = Array.isArray(parsedColors) ? parsedColors : [parsedColors];
        } catch (e) {
          colors = [];
        }
      }

      const image = req.file;
      const imageUrl = req.body.imageUrl || '';
      const imageAlt = req.body.imageAlt || '';
      const metaTitle = req.body.metaTitle || '';
      const metaDescription = req.body.metaDescription || '';
      const fullDescription = req.body.fullDescription || '';
      const specification = req.body.specification || '';

      // Determine if product has minimal data
      // If brand, category, description, or price is missing, set isActive to false
      const hasMinimalData = !brand || !category || !description || !price;
      const isActive = req.body.isActive !== undefined
        ? req.body.isActive
        : (hasMinimalData ? false : true);

      // Upload image if provided
      let imageKey = '';
      if (image) {
        const uploadResult = await s3Upload(image);
        imageKey = uploadResult.imageKey;
      }

      const product = new Product({
        sku,
        name,
        shortName,
        description,
        quantity,
        price,
        previousPrice,
        buyingPrice,
        wholeSellPrice,
        history,
        popular,
        premium,
        isActive,
        brand,
        tags,
        category,
        colors,
        imageUrl,
        imageKey,
        imageAlt,
        metaTitle,
        metaDescription,
        fullDescription,
        specification
      });

      const savedProduct = await product.save();

      res.status(200).json({
        success: true,
        message: `Product has been added successfully!`,
        product: savedProduct
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// fetch products api
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, isActive } = req.query; // Default: page 1, limit 100
    const skip = (Number(page) - 1) * Number(limit);

    let products = [];
    let total = 0;

    const query = {};
    if (isActive) {
      query.isActive = isActive === 'true';
    }

    if (req.user && req.user.merchant) {
      const brands = await Brand.find({
        merchant: req.user.merchant
      }).populate('merchant', '_id');

      const brandId = brands[0]?.['_id'];

      const merchantQuery = { ...query, brand: brandId };

      total = await Product.countDocuments(merchantQuery);

      products = await Product.find(merchantQuery)
        .populate({
          path: 'brand',
          populate: {
            path: 'merchant',
            model: 'Merchant'
          }
        })
        .populate('category')
        .limit(Number(limit))
        .skip(skip)
        .sort({ created: -1 }); // Most recent first
    } else {
      total = await Product.countDocuments(query);

      products = await Product.find(query)
        .populate({
          path: 'brand',
          populate: {
            path: 'merchant',
            model: 'Merchant'
          }
        })
        .populate('category')
        .limit(Number(limit))
        .skip(skip)
        .sort({ created: -1 }); // Most recent first
    }

    res.status(200).json({
      products,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch product api
router.get(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;

      let productDoc = null;

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant
        }).populate('merchant', '_id');

        const brandId = brands[0]['_id'];

        productDoc = await Product.findOne({ _id: productId })
          .populate({
            path: 'brand',
            select: 'name'
          })
          .where('brand', brandId);
      } else {
        productDoc = await Product.findOne({ _id: productId }).populate([
          {
            path: 'brand',
            select: 'name'
          },
          {
            path: 'category',
            select: 'name'
          }
        ]);
      }

      if (!productDoc) {
        return res.status(404).json({
          message: 'No product found.'
        });
      }

      res.status(200).json({
        product: productDoc
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
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };
      const { sku, slug, note } = req.body.product; // Include a note for the update

      // Find the existing product
      const existingProduct = await Product.findById(productId);

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      // Check for duplicate SKU or slug
      const foundProduct = await Product.findOne({
        $or: [{ slug }, { sku }],
        _id: { $ne: productId } // Exclude the current product
      });

      if (foundProduct) {
        return res
          .status(400)
          .json({ error: 'SKU or slug is already in use.' });
      }

      // Prepare the history entry
      const keysToTrack = [
        'quantity',
        'previousPrice',
        'price',
        'buyingPrice',
        'wholeSellPrice'
      ];
      const changes = {};

      keysToTrack.forEach(key => {
        if (key in update) {
          update[key] = Number(update[key]);
          if (existingProduct[key] !== update[key]) {
            changes[key] = {
              old: existingProduct[key], // Previous value
              new: update[key] // New value
            };
          }
        }
      });

      // Add the history entry if there are changes
      if (Object.keys(changes).length > 0) {
        const historyEntry = {
          updatedAt: new Date(),
          updatedBy: req.user.firstName, // User who made the update
          changes,
          note: note || '' // Optional note
        };

        // Push the history entry to the product's history array or create a new array
        update.history = Array.isArray(existingProduct.history)
          ? [historyEntry, ...existingProduct.history]
          : [historyEntry];
      }

      // Update the product with the new data
      Object.assign(existingProduct, update);
      const updatedProduct = await existingProduct.save();

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!',
        product: updatedProduct
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
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };

      await Product.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!'
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
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const product = await Product.deleteOne({ _id: req.params.id });

      res.status(200).json({
        success: true,
        message: `Product has been deleted successfully!`,
        product
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

module.exports = router;
