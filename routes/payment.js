var express = require('express');
var router = express.Router();
// import OrderProduct from '../models/order';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
router.post('/', async (req, res) => {
  
  const { products } = req.body;
  console.log(products,"productsss");
  
  const line_items = products.map((product) => {
    return {
      price_data: {
        currency: 'aed',
        product_data: {
          name: product.name,
          images: [product.image],
        },
        unit_amount: product.price * 100,
      },
      quantity: product.quantity,
    };
  })
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: 'http://localhost:3000/success',
    cancel_url: 'http://localhost:3000/cancel',
  });
  res.json({ url: session.url });
  if (err) {
    res.status(500).json({ error: err.message });
  }

});

module.exports = router;
