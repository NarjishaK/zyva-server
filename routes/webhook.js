var express = require('express');
var router = express.Router();
const customerOrder = require('../models/order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

// 2. Create webhook endpoint to handle Stripe events
router.post('/stripe/callback', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  
  console.log("payment callback received from stripe. req.body:", req.body);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
// const event = JSON.parse(req.body.toString());
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleSuccessfulPayment(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
    case 'payment_intent.processing':
      await handleProcessingPayment(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// 3. Payment status handlers
async function handleSuccessfulPayment(session) {
  try {
    const orderId = session.metadata.orderId;
    const paidAmount = session.amount_total / 100; // Convert from fils to AED

    await customerOrder.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paidAmount: paidAmount,
      orderStatus: 'processing',
      'paymentDetails.transactionId': session.payment_intent,
      $push: {
        statusHistory: {
          status: 'paid',
          timestamp: new Date(),
          note: 'Payment completed successfully'
        }
      }
    });

    console.log(`Payment successful for order ${orderId}`);
  } catch (error) {
    console.error('Error updating successful payment:', error);
  }
}

async function handleFailedPayment(paymentIntent) {
  try {
    // Find order by payment intent ID
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
            note: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
          }
        }
      });

      console.log(`Payment failed for order ${order._id}`);
    }
  } catch (error) {
    console.error('Error updating failed payment:', error);
  }
}

async function handleProcessingPayment(paymentIntent) {
  try {
    // Find order by payment intent ID
    const order = await customerOrder.findOne({
      'paymentDetails.transactionId': paymentIntent.id
    });

    if (order && order.paymentStatus === 'pending') {
      await customerOrder.findByIdAndUpdate(order._id, {
        paymentStatus: 'pending', // Keep as pending while processing
        $push: {
          statusHistory: {
            status: 'payment_processing',
            timestamp: new Date(),
            note: 'Payment is being processed'
          }
        }
      });

      console.log(`Payment processing for order ${order._id}`);
    }
  } catch (error) {
    console.error('Error updating processing payment:', error);
  }
}

module.exports = router;