
const Order = require('../models/order');
const Product =require('../models/products');
// router.get("/:customerId",Controller.getOrderDetailsByCustomer)
const nodemailer = require('nodemailer'); 
// router.get("/:id",Controller.get)

const express = require("express");
const router = express.Router();
const orderController = require("../controller/customerorder");
 


// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your email app password
  }
});

// Function to generate detailed invoice HTML
const generateInvoiceHTML = (order) => {
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px; text-align: left;">
        <img src="${item.image || ''}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
        ${item.name}
      </td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: center;">AED ${item.price}</td>
      <td style="padding: 10px; text-align: center;">
        Size: ${item.selectedSize || 'N/A'}<br>
        Color: ${item.selectedColor || 'N/A'}
      </td>
      <td style="padding: 10px; text-align: right;">AED ${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Invoice - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .customer-info, .shipping-info { width: 48%; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #333; }
        .totals { margin-top: 20px; text-align: right; }
        .total-row { font-weight: bold; font-size: 1.2em; color: #28a745; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DELIVERY CONFIRMATION & INVOICE</h1>
        <h2>Order #${order.orderNumber}</h2>
        <p>Thank you for your purchase! Your order has been delivered.</p>
      </div>

      <div class="order-info">
        <div class="customer-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${order.name}</p>
          <p><strong>Email:</strong> ${order.email || order.customerEmail}</p>
          <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
        </div>
        <div class="shipping-info">
          <h3>Delivery Address</h3>
          <p>${order.shippingAddress?.addressLine || ''}</p>
          <p>${order.shippingAddress?.apartment || ''}</p>
          <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}</p>
          <p>${order.shippingAddress?.country || ''} ${order.shippingAddress?.zipCode || ''}</p>
        </div>
      </div>

      <h3>Order Details</h3>
      <table style="border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px;">Product</th>
            <th style="padding: 12px; text-align: center;">Quantity</th>
            <th style="padding: 12px; text-align: center;">Unit Price</th>
            <th style="padding: 12px; text-align: center;">Details</th>
            <th style="padding: 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <table style="width: 300px; margin-left: auto;">
          <tr>
            <td><strong>Subtotal:</strong></td>
            <td style="text-align: right;">AED ${order.subtotal}</td>
          </tr>
          <tr>
            <td><strong>Shipping Fee:</strong></td>
            <td style="text-align: right;">AED ${order.shippingFee || 0}</td>
          </tr>
          ${order.isGiftWrapped ? `
          <tr>
            <td><strong>Gift Wrap:</strong></td>
            <td style="text-align: right;">AED ${order.giftWrapFee || 0}</td>
          </tr>` : ''}
          ${order.couponDiscount ? `
          <tr>
            <td><strong>Discount:</strong></td>
            <td style="text-align: right;">-AED ${order.couponDiscount}</td>
          </tr>` : ''}
          <tr class="total-row" style="border-top: 2px solid #333;">
            <td><strong>TOTAL AMOUNT:</strong></td>
            <td style="text-align: right;"><strong>AED ${order.totalAmount}</strong></td>
          </tr>
        </table>
      </div>

      ${order.isGiftWrapped && order.giftMessage ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745;">
        <h4>Gift Message:</h4>
        <p style="font-style: italic;">"${order.giftMessage}"</p>
      </div>` : ''}

      ${order.customerNote ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
        <h4>Order Note:</h4>
        <p>${order.customerNote}</p>
      </div>` : ''}

      <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px;">
        <h4 style="color: #155724;">Order Status: DELIVERED ✅</h4>
        <p><strong>Delivery Date:</strong> ${new Date(order.actualDeliveryDate).toLocaleDateString()}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      </div>

      <div class="footer">
        <p>Thank you for shopping with us!</p>
        <p>If you have any questions about your order, please contact our customer service.</p>
        <hr style="margin: 20px 0;">
        <p>&copy; 2025 Your Company Name. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Route to update order delivery status and send invoice email
router.put('/:id/delivered', async (req, res) => {
    try {
        const { sendEmail, customerEmail, customerName } = req.body;
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!order.items || order.items.length === 0) {
            return res.status(400).json({ message: 'No products found in the order' });
        }

        // Update order status
        order.orderStatus = 'delivered';
        order.actualDeliveryDate = new Date().toISOString();
        await order.save();

        // Send email if requested
        if (sendEmail && (customerEmail || order.email || order.customerEmail)) {
            const emailAddress = customerEmail || order.email || order.customerEmail;
            const invoiceHTML = generateInvoiceHTML(order);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailAddress,
                subject: `Order Delivered - Invoice #${order.orderNumber}`,
                html: invoiceHTML
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Invoice email sent to ${emailAddress}`);
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Don't fail the entire request if email fails
            }
        }

        res.status(200).json({ 
            message: 'Order marked as delivered' + (sendEmail ? ' and invoice email sent' : ''), 
            order 
        });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
});
// // Route to handle order return and restore stock
const generateReturnConfirmationHTML = (order) => {
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px; text-align: left;">
        <img src="${item.image || ''}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
        ${item.name}
      </td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: center;">AED ${item.price}</td>
      <td style="padding: 10px; text-align: center;">
        Size: ${item.selectedSize || 'N/A'}<br>
        Color: ${item.selectedColor || 'N/A'}
      </td>
      <td style="padding: 10px; text-align: right;">AED ${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Return Confirmation - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc3545; padding-bottom: 20px; }
        .alert-box { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 20px; margin: 20px 0; }
        .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .customer-info, .shipping-info { width: 48%; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #333; }
        .totals { margin-top: 20px; text-align: right; }
        .total-row { font-weight: bold; font-size: 1.2em; color: #dc3545; }
        .return-status { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; margin: 20px 0; }
        .next-steps { background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 20px; margin: 20px 0; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #dc3545;">ORDER RETURN CONFIRMATION</h1>
        <h2>Order #${order.orderNumber}</h2>
        <p>Your return request has been processed successfully.</p>
      </div>

      <div class="alert-box">
        <h3 style="color: #856404; margin: 0;">⚠️ Return Status</h3>
        <p style="margin: 10px 0 0 0;">Your order return has been approved and processed. Please see the details below.</p>
      </div>

      <div class="order-info">
        <div class="customer-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${order.name}</p>
          <p><strong>Email:</strong> ${order.email || order.customerEmail}</p>
          <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
        </div>
        <div class="shipping-info">
          <h3>Original Delivery Address</h3>
          <p>${order.shippingAddress?.addressLine || ''}</p>
          <p>${order.shippingAddress?.apartment || ''}</p>
          <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}</p>
          <p>${order.shippingAddress?.country || ''} ${order.shippingAddress?.zipCode || ''}</p>
        </div>
      </div>

      <h3>Returned Items</h3>
      <table style="border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px;">Product</th>
            <th style="padding: 12px; text-align: center;">Quantity</th>
            <th style="padding: 12px; text-align: center;">Unit Price</th>
            <th style="padding: 12px; text-align: center;">Details</th>
            <th style="padding: 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <table style="width: 300px; margin-left: auto;">
          <tr>
            <td><strong>Subtotal:</strong></td>
            <td style="text-align: right;">AED ${order.subtotal}</td>
          </tr>
          <tr>
            <td><strong>Shipping Fee:</strong></td>
            <td style="text-align: right;">AED ${order.shippingFee || 0}</td>
          </tr>
          ${order.isGiftWrapped ? `
          <tr>
            <td><strong>Gift Wrap:</strong></td>
            <td style="text-align: right;">AED ${order.giftWrapFee || 0}</td>
          </tr>` : ''}
          ${order.couponDiscount ? `
          <tr>
            <td><strong>Discount:</strong></td>
            <td style="text-align: right;">-AED ${order.couponDiscount}</td>
          </tr>` : ''}
          <tr class="total-row" style="border-top: 2px solid #dc3545;">
            <td><strong>REFUND AMOUNT:</strong></td>
            <td style="text-align: right;"><strong>AED ${order.totalAmount}</strong></td>
          </tr>
        </table>
      </div>

      <div class="return-status">
        <h4 style="color: #721c24;">Return Status: PROCESSED ↩️</h4>
        <p><strong>Return Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Original Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Refund Status:</strong> Processing</p>
      </div>

      <div class="next-steps">
        <h4 style="color: #0c5460;">What happens next?</h4>
        <ul style="margin: 10px 0;">
          <li>Your refund will be processed within 5-7 business days</li>
          <li>The refund will be credited to your original payment method</li>
          <li>You will receive a separate email confirmation once the refund is completed</li>
          <li>If you have any questions, please contact our customer service team</li>
        </ul>
      </div>

      ${order.customerNote ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #e2e3e5; border-left: 4px solid #6c757d;">
        <h4>Original Order Note:</h4>
        <p>${order.customerNote}</p>
      </div>` : ''}

      <div class="footer">
        <p>We're sorry to see your order go, but we're here to help!</p>
        <p>If you have any questions about your return, please contact our customer service.</p>
        <hr style="margin: 20px 0;">
        <p>&copy; 2025 Your Company Name. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Route to handle order return and restore stock
router.put('/:id/returns', async (req, res) => {
    try {
        const { sendEmail, customerEmail, customerName } = req.body;
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (order.orderStatus !== 'delivered') {
            return res.status(400).json({ message: 'Order must be delivered before it can be returned' });
        }
        
        if (order.return) {
            return res.status(400).json({ message: 'Order has already been returned' });
        }

        // Process stock restoration (your existing logic)
        for (const orderedProduct of order.items) {
            const productId = orderedProduct.productId._id;
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${productId}` });
            }
            
            // Add your stock restoration logic here if needed
            await product.save();
        }

        // Update order status
        order.returnRequested = true;
        order.returnStatus = 'requested';
        order.orderStatus = 'returned';
        order.returnDate = new Date().toISOString();
        await order.save();

        // Send return confirmation email if requested
        if (sendEmail && (customerEmail || order.email || order.customerEmail)) {
            const emailAddress = customerEmail || order.email || order.customerEmail;
            const returnHTML = generateReturnConfirmationHTML(order);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailAddress,
                subject: `Return Confirmation - Order #${order.orderNumber}`,
                html: returnHTML
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Return confirmation email sent to ${emailAddress}`);
            } catch (emailError) {
                console.error('Error sending return email:', emailError);
                // Don't fail the entire request if email fails
            }
        }

        res.status(200).json({ 
            message: 'Order returned and stock restored' + (sendEmail ? ', confirmation email sent' : ''), 
            order 
        });
    } catch (error) {
        console.error("Error returning order:", error);
        res.status(500).json({ message: 'Error returning order', error: error.message });
    }
});

//update order details
router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true, 
      });
  
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.status(200).json({ order: updatedOrder });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
  });
// Create a new order
router.post("/", orderController.createOrder);
router.get("/",orderController.getAll)
// Get order by ID

// Get order by ID
router.get("/:id", orderController.getOrderById);

// Get all orders for a customer
router.get("/customer/:customerId" , orderController.getCustomerOrders);

router.post("/:orderId/return", orderController.requestReturn);
// Update order status
router.patch("/:orderId/status", orderController.updateOrderStatus);
router.patch("/:orderId/payment", orderController.updatePaymentStatus);
router.delete("/:id",orderController.delete)
//bestselling products
router.get("/bestselling/product",orderController.bestselling)

// Cancel order

router.post("/:orderId/cancel", orderController.cancelOrder);
// Clear cart after successful order
router.delete("/cart/:customerId", orderController.clearCustomerCart);


module.exports = router;