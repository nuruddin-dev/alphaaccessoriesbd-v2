const express = require('express');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const Product = require('../../models/product');

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    // Fetch product data
    const products = await Product.find().select('slug');

    // Define static URLs
    const links = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/about-us', changefreq: 'monthly', priority: 0.8 },
      { url: '/categories', changefreq: 'weekly', priority: 0.9 },
      { url: '/brands', changefreq: 'weekly', priority: 0.9 }
    ];

    // Add dynamic product URLs
    products.forEach(product => {
      links.push({
        url: `/${product.slug}`,
        changefreq: 'weekly',
        priority: 0.7
      });
    });

    // Generate the sitemap
    const stream = new SitemapStream({
      hostname: 'https://alphaaccessoriesbd.com'
    });
    const xmlData = await streamToPromise(Readable.from(links).pipe(stream));

    res.header('Content-Type', 'application/xml');
    res.send(xmlData.toString());
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
