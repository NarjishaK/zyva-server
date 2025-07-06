var express = require('express');
var router = express.Router();
const customerOrder = require('../models/order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
router.post('/', async (req, res) => {
  try {
    const { 
      products, 
      couponCode, 
      couponDiscount, 
      couponDetails,
      vatAmount,
      isGiftWrapped,
      giftMessage 
    } = req.body;

    // Calculate line items for products
    const line_items = products.map((item) => {
      const basePrice = item.productId.price;
      const vat = item.productId.vat || 0;
      const finalPriceWithVat = basePrice + (basePrice * vat) / 100;
      const priceInFils = Math.round(finalPriceWithVat * 100);
      
      return {
        price_data: {
          currency: 'aed',
          product_data: {
            name: item.productId.title,
            metadata: {
              productId: item.productId._id,
              selectedColor: item.selectedProductColor || '',
              selectedSize: item.selectedProductSize || ''
            }
          },
          unit_amount: priceInFils,
        },
        quantity: item.quantity,
      };
    });

    // Add gift wrapping as a line item if selected
    if (isGiftWrapped) {
      line_items.push({
        price_data: {
          currency: 'aed',
          product_data: {
            name: 'Gift Wrapping',
            description: giftMessage || 'Gift wrapping service'
          },
          unit_amount: 3000, // 30 AED in fils
        },
        quantity: 1,
      });
    }

    // Create session configuration
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: process.env.CLIENT_URL + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.CLIENT_URL + '/cancel',
      metadata: {
        products: JSON.stringify(products.map(item => ({
          productId: item.productId._id,
          title: item.productId.title,
          price: item.productId.price,
          vat: item.productId.vat || 0,
          quantity: item.quantity,
          selectedColor: item.selectedProductColor || '',
          selectedSize: item.selectedProductSize || ''
        }))),
        vatAmount: vatAmount?.toString() || '0',
        isGiftWrapped: isGiftWrapped?.toString() || 'false',
        giftMessage: giftMessage || '',
        couponCode: couponCode || '',
        couponDiscount: couponDiscount?.toString() || '0'
      }
    };

    // Apply coupon discount if available
    if (couponCode && couponDiscount > 0) {
      // Convert discount to fils (multiply by 100 and round)
      const discountInFils = Math.round(couponDiscount * 100);
      
      sessionConfig.discounts = [{
        coupon: await createStripeCoupon(couponCode, discountInFils, couponDetails)
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to create Stripe coupon
async function createStripeCoupon(couponCode, discountInFils, couponDetails) {
  try {
    // Check if coupon already exists
    let coupon;
    try {
      coupon = await stripe.coupons.retrieve(couponCode);
    } catch (error) {
      // Coupon doesn't exist, create new one
      if (couponDetails && couponDetails.discountType === 'percentage') {
        coupon = await stripe.coupons.create({
          id: couponCode,
          percent_off: couponDetails.discountValue,
          duration: 'once',
        });
      } else {
        coupon = await stripe.coupons.create({
          id: couponCode,
          amount_off: discountInFils,
          currency: 'aed',
          duration: 'once',
        });
      }
    }
    
    return coupon.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

// New route to retrieve session details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    });

    if (session.payment_status === 'paid') {
      res.json({
        success: true,
        session: {
          id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email,
          payment_status: session.payment_status,
          payment_method_types: session.payment_method_types,
          created: session.created,
          metadata: session.metadata,
          line_items: session.line_items
        }
      });
    } else {
      res.json({ success: false, message: 'Payment not completed' });
    }
  } catch (err) {
    console.error('Session retrieval error:', err.message);
    res.status(500).json({ error: err.message });
  }
});





// 5. Cancel page route - handle cancelled payments
router.get('/cancel', async (req, res) => {
  try {
    const { order_id } = req.query;

    if (order_id) {
      await customerOrder.findByIdAndUpdate(order_id, {
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        $push: {
          statusHistory: {
            status: 'cancelled',
            timestamp: new Date(),
            note: 'Payment cancelled by user'
          }
        }
      });
    }

    res.json({ 
      status: 'cancelled', 
      message: 'Payment was cancelled',
      orderId: order_id
    });

  } catch (error) {
    console.error('Error handling cancelled payment:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error handling cancelled payment' 
    });
  }
});

// 6. Get payment status route
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await customerOrder.findById(orderId)
      .select('paymentStatus orderStatus paidAmount totalAmount statusHistory');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: orderId,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paidAmount: order.paidAmount,
      totalAmount: order.totalAmount,
      statusHistory: order.statusHistory
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ error: 'Error retrieving payment status' });
  }
});

// Helper function to create Stripe coupon (unchanged)
async function createStripeCoupon(couponCode, discountInFils, couponDetails) {
  try {
    let coupon;
    try {
      coupon = await stripe.coupons.retrieve(couponCode);
    } catch (error) {
      if (couponDetails && couponDetails.discountType === 'percentage') {
        coupon = await stripe.coupons.create({
          id: couponCode,
          percent_off: couponDetails.discountValue,
          duration: 'once',
        });
      } else {
        coupon = await stripe.coupons.create({
          id: couponCode,
          amount_off: discountInFils,
          currency: 'aed',
          duration: 'once',
        });
      }
    }
    
    return coupon.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}
module.exports = router;