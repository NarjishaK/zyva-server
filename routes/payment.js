var express = require('express');
var router = express.Router();
const customerOrder = require('../models/order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

// 1. Create checkout session (your existing code)
router.post('/', async (req, res) => {
  try {
    const { 
      products, 
      couponCode, 
      couponDiscount, 
      couponDetails,
      vatAmount,
      isGiftWrapped,
      giftMessage,
      orderId // Make sure to pass orderId from frontend
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
      cancel_url: process.env.CLIENT_URL + '/cancel?session_id={CHECKOUT_SESSION_ID}',
      metadata: {
        orderId: orderId, // Add orderId to metadata
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

// 3. New route to update payment status from frontend
router.post('/update-status', async (req, res) => {
  try {
    const { sessionId, status } = req.body;
    
    if (!sessionId || !status) {
      return res.status(400).json({ error: 'Session ID and status are required' });
    }

    // Get session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    let orderId = session.metadata.orderId;

    // If orderId is not in metadata, try to find order by session amount and recent timestamp
    if (!orderId) {
      console.log('Order ID not found in metadata, searching by session details...');
      
      // Try to find the order by amount and recent creation time
      const sessionAmount = session.amount_total / 100; // Convert from fils to AED
      const sessionCreatedTime = new Date(session.created * 1000);
      const fiveMinutesAgo = new Date(sessionCreatedTime.getTime() - 5 * 60 * 1000);
      
      const recentOrder = await customerOrder.findOne({
        totalAmount: sessionAmount,
        paymentStatus: 'pending',
        createdAt: { $gte: fiveMinutesAgo }
      }).sort({ createdAt: -1 });

      if (recentOrder) {
        orderId = recentOrder._id;
        console.log(`Found order by amount and time: ${orderId}`);
      } else {
        return res.status(400).json({ 
          error: 'Order not found. Please ensure the order was created properly.',
          sessionAmount: sessionAmount,
          sessionCreated: sessionCreatedTime
        });
      }
    }

    let updateData = {};
    let statusNote = '';

    switch (status) {
      case 'paid':
        updateData = {
          paymentStatus: 'paid',
          paidAmount: session.amount_total / 100,
          orderStatus: 'processing',
          'paymentDetails.transactionId': session.payment_intent
        };
        statusNote = 'Payment completed successfully';
        break;
      case 'failed':
        updateData = {
          paymentStatus: 'failed',
          orderStatus: 'cancelled'
        };
        statusNote = 'Payment cancelled by user';
        break;
      default:
        return res.status(400).json({ error: 'Invalid status' });
    }

    // Add status history
    updateData.$push = {
      statusHistory: {
        status: status,
        timestamp: new Date(),
        note: statusNote
      }
    };

    await customerOrder.findByIdAndUpdate(orderId, updateData);

    res.json({ 
      success: true, 
      message: `Payment status updated to ${status}`,
      orderId: orderId
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Error updating payment status' });
  }
});

// 4. Payment status handlers for webhook
async function handleSuccessfulPayment(session) {
  try {
    const orderId = session.metadata.orderId;
    const paidAmount = session.amount_total / 100;

    await customerOrder.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paidAmount: paidAmount,
      orderStatus: 'processing',
      'paymentDetails.transactionId': session.payment_intent,
      $push: {
        statusHistory: {
          status: 'paid',
          timestamp: new Date(),
          note: 'Payment completed successfully via webhook'
        }
      }
    });

    console.log(`Payment successful for order ${orderId} via webhook`);
  } catch (error) {
    console.error('Error updating successful payment:', error);
  }
}

async function handleFailedPayment(session) {
  try {
    const orderId = session.metadata.orderId;

    await customerOrder.findByIdAndUpdate(orderId, {
      paymentStatus: 'failed',
      orderStatus: 'cancelled',
      $push: {
        statusHistory: {
          status: 'payment_failed',
          timestamp: new Date(),
          note: 'Payment failed via webhook'
        }
      }
    });

    console.log(`Payment failed for order ${orderId} via webhook`);
  } catch (error) {
    console.error('Error updating failed payment:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Find order by payment intent ID
    const order = await customerOrder.findOne({
      'paymentDetails.transactionId': paymentIntent.id
    });

    if (order) {
      await customerOrder.findByIdAndUpdate(order._id, {
        paymentStatus: 'paid',
        paidAmount: paymentIntent.amount / 100,
        orderStatus: 'processing',
        $push: {
          statusHistory: {
            status: 'paid',
            timestamp: new Date(),
            note: 'Payment intent succeeded'
          }
        }
      });
    }
  } catch (error) {
    console.error('Error updating payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const order = await customerOrder.findOne({
      'paymentDetails.transactionId': paymentIntent.id
    });

    if (order) {
      await customerOrder.findByIdAndUpdate(order._id, {
        paymentStatus: 'failed',
        $push: {
          statusHistory: {
            status: 'payment_failed',
            timestamp: new Date(),
            note: `Payment intent failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
          }
        }
      });
    }
  } catch (error) {
    console.error('Error updating payment intent failed:', error);
  }
}

// Helper function to create Stripe coupon (your existing code)
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

// Get session details (your existing code)
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

// Get payment status route (your existing code)
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

module.exports = router;