var express = require('express');
var router = express.Router();
const customerOrder = require('../models/order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const getSuccessEmailTemplate = (orderDetails) => {
  const itemsHtml = orderDetails.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; margin-right: 10px; border-radius: 4px;">` : ''}
          <div>
            <strong>${item.name}</strong><br>
            ${item.selectedColor ? `Color: ${item.selectedColor}<br>` : ''}
            ${item.selectedSize ? `Size: ${item.selectedSize}<br>` : ''}
            Quantity: ${item.quantity}
          </div>
        </div>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${item.price} AED
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${(item.price * item.quantity).toFixed(2)} AED
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Payment Successful!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your order</p>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #667eea; margin-top: 0;">Order Details</h2>
          <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${orderDetails.name}</p>
          <p><strong>Email:</strong> ${orderDetails.email}</p>
          <p><strong>Phone:</strong> ${orderDetails.phone}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; margin-top: 0;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9ff;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #667eea;">Item</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #667eea;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #667eea;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; margin-top: 0;">Shipping Address</h3>
          <p style="margin: 5px 0;"><strong>${orderDetails.shippingAddress.label || 'Shipping Address'}</strong></p>
          <p style="margin: 5px 0;">${orderDetails.shippingAddress.addressLine}</p>
          ${orderDetails.shippingAddress.apartment ? `<p style="margin: 5px 0;">${orderDetails.shippingAddress.apartment}</p>` : ''}
          <p style="margin: 5px 0;">${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state}</p>
          <p style="margin: 5px 0;">${orderDetails.shippingAddress.country} ${orderDetails.shippingAddress.zipCode || ''}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; margin-top: 0;">Order Summary</h3>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px 0;">Subtotal:</td>
              <td style="text-align: right; padding: 5px 0;">${orderDetails.subtotal.toFixed(2)} AED</td>
            </tr>
            ${orderDetails.vatAmount > 0 ? `
            <tr>
              <td style="padding: 5px 0;">VAT:</td>
              <td style="text-align: right; padding: 5px 0;">${orderDetails.vatAmount.toFixed(2)} AED</td>
            </tr>` : ''}
            ${orderDetails.shippingFee > 0 ? `
            <tr>
              <td style="padding: 5px 0;">Shipping:</td>
              <td style="text-align: right; padding: 5px 0;">${orderDetails.shippingFee.toFixed(2)} AED</td>
            </tr>` : ''}
            ${orderDetails.isGiftWrapped ? `
            <tr>
              <td style="padding: 5px 0;">Gift Wrapping:</td>
              <td style="text-align: right; padding: 5px 0;">${orderDetails.giftWrapFee.toFixed(2)} AED</td>
            </tr>` : ''}
            ${orderDetails.couponDiscount > 0 ? `
            <tr style="color: #28a745;">
              <td style="padding: 5px 0;">Discount (${orderDetails.couponCode}):</td>
              <td style="text-align: right; padding: 5px 0;">-${orderDetails.couponDiscount.toFixed(2)} AED</td>
            </tr>` : ''}
            <tr style="border-top: 2px solid #667eea; font-weight: bold; font-size: 18px;">
              <td style="padding: 10px 0;">Total Paid:</td>
              <td style="text-align: right; padding: 10px 0; color: #667eea;">${orderDetails.totalAmount.toFixed(2)} AED</td>
            </tr>
          </table>
        </div>

        ${orderDetails.isGiftWrapped && orderDetails.giftMessage ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; margin-top: 0;">🎁 Gift Message</h3>
          <p style="font-style: italic; background: #f8f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
            "${orderDetails.giftMessage}"
          </p>
        </div>` : ''}

        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; border: 1px solid #bee5eb;">
          <h3 style="color: #0c5460; margin-top: 0;">📦 What's Next?</h3>
          <p style="margin: 5px 0;">• We'll process your order within 1-2 business days</p>
          <p style="margin: 5px 0;">• You'll receive a shipping confirmation email with tracking details</p>
          <p style="margin: 5px 0;">• Expected delivery: ${orderDetails.estimatedDeliveryDate ? new Date(orderDetails.estimatedDeliveryDate).toLocaleDateString() : '3-7 business days'}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666;">Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #667eea;">${process.env.EMAIL_USER}</a></p>
          <p style="color: #888; font-size: 14px; margin-top: 20px;">Thank you for shopping with us! 🛍️</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

const getFailedEmailTemplate = (customerName, customerEmail, orderNumber) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">💳 Payment Issue</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We couldn't process your payment</p>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #ff6b6b; margin-top: 0;">Hi ${customerName},</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">We're sorry, but we weren't able to process your payment for order <strong>${orderNumber}</strong>.</p>
          
          <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #c53030; margin-top: 0; font-size: 18px;">🚫 Payment Status: Failed</h3>
            <p style="margin-bottom: 0; color: #744b4b;">Your payment was cancelled or declined. No charges have been made to your account.</p>
          </div>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2d3748; margin-top: 0;">🔄 What you can do:</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li><strong>Try again:</strong> Go back to your cart and attempt the payment once more</li>
            <li><strong>Check your card:</strong> Ensure your card details are correct and you have sufficient funds</li>
            <li><strong>Use a different payment method:</strong> Try a different card or payment option</li>
            <li><strong>Contact your bank:</strong> Sometimes banks block online transactions for security</li>
          </ul>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2d3748; margin-top: 0;">📞 Need Help?</h3>
          <p style="margin-bottom: 15px;">If you continue to experience issues, please don't hesitate to contact us:</p>
          <div style="background: #f7fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #4299e1;">
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${process.env.EMAIL_USER}" style="color: #4299e1;">${process.env.EMAIL_USER}</a></p>
            <p style="margin: 5px 0;"><strong>We're here to help!</strong> Our support team will assist you with completing your order.</p>
          </div>
        </div>

        <div style="text-align: center; background: #e6fffa; padding: 25px; border-radius: 8px; border: 1px solid #b2f5ea;">
          <h3 style="color: #234e52; margin-top: 0;">💡 Your items are still waiting!</h3>
          <p style="color: #2d3748; margin-bottom: 20px;">Don't worry, your cart items are saved. You can complete your purchase anytime.</p>
          <a href="${process.env.CLIENT_URL}/cart" style="background: #38b2ac; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Continue Shopping</a>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin-bottom: 10px;">We appreciate your business and apologize for any inconvenience.</p>
          <p style="color: #888; font-size: 14px;">Thank you for choosing us! 🛍️</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

// Send email function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"Your Store" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

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

// 3. Updated route to update payment status and send emails
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

    // Update the order
    const updatedOrder = await customerOrder.findByIdAndUpdate(orderId, updateData, { new: true });
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Send appropriate email based on status
    let emailSent = false;
    
    if (status === 'paid') {
      // Send success email
      const emailSubject = `✅ Order Confirmed - ${updatedOrder.orderNumber}`;
      const emailHtml = getSuccessEmailTemplate(updatedOrder);
      emailSent = await sendEmail(updatedOrder.email, emailSubject, emailHtml);
      
      if (emailSent) {
        console.log(`Success email sent to ${updatedOrder.email} for order ${updatedOrder.orderNumber}`);
      }
      
    } else if (status === 'failed') {
      // Send failure email
      const emailSubject = `❌ Payment Issue - ${updatedOrder.orderNumber}`;
      const emailHtml = getFailedEmailTemplate(
        updatedOrder.name, 
        updatedOrder.email, 
        updatedOrder.orderNumber
      );
      emailSent = await sendEmail(updatedOrder.email, emailSubject, emailHtml);
      
      if (emailSent) {
        console.log(`Failed payment email sent to ${updatedOrder.email} for order ${updatedOrder.orderNumber}`);
      }
    }

    res.json({ 
      success: true, 
      message: `Payment status updated to ${status}`,
      orderId: orderId,
      emailSent: emailSent
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Error updating payment status' });
  }
});

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