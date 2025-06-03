var express = require('express');
var router = express.Router();
// import OrderProduct from '../models/order';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
router.post('/', async (req, res) => {
  try {
    const { products } = req.body;

    const line_items = products.map((item) => {
      const priceInFils = Math.round(item.productId.price * 100); // Convert AED to fils

      return {
        price_data: {
          currency: 'aed',
          product_data: {
            name: item.productId.title,
            // images: [`https://yourdomain.com/uploads/${item.productId.coverimage}`], // Ensure this is a valid HTTPS URL
          },
          unit_amount: priceInFils, // Required field
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:3001/',
      cancel_url: 'http://localhost:3001/shop-grid-standard',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
