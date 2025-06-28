// emailService.js - Email receipt service
const nodemailer = require('nodemailer');

// Configure your email transporter (example using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS // your email password or app password
  }
});

// Alternative configuration for other SMTP services
// const transporter = nodemailer.createTransporter({
//   host: 'smtp.your-email-provider.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

// Generate HTML template for payment receipt
const generateReceiptHTML = (receiptData) => {
  const { 
    orderDetails, 
    paymentStatus, 
    customerDetails, 
    items, 
    totals,
    orderNumber,
    paymentDetails 
  } = receiptData;

  const statusColor = paymentStatus === 'paid' ? '#28a745' : 
                     paymentStatus === 'failed' ? '#dc3545' : '#ffc107';
  
  const statusText = paymentStatus === 'paid' ? 'Payment Successful' :
                    paymentStatus === 'failed' ? 'Payment Failed' :
                    paymentStatus === 'pending' ? 'Payment Pending' : 'Payment Processing';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - ${orderNumber}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 10px; 
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
        .status-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          background: ${statusColor}; 
          color: white; 
          font-weight: bold; 
          margin-top: 10px;
          font-size: 14px;
        }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; }
        .section h3 { 
          color: #667eea; 
          border-bottom: 2px solid #e9ecef; 
          padding-bottom: 8px; 
          margin-bottom: 15px;
          font-size: 18px;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
          margin-bottom: 20px;
        }
        .info-item { background: #f8f9fa; padding: 12px; border-radius: 5px; }
        .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .info-value { font-size: 14px; margin-top: 4px; }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .items-table th { 
          background: #667eea; 
          color: white; 
          padding: 12px; 
          text-align: left; 
          font-weight: 600;
          font-size: 14px;
        }
        .items-table td { 
          padding: 12px; 
          border-bottom: 1px solid #e9ecef; 
          font-size: 14px;
        }
        .items-table tr:last-child td { border-bottom: none; }
        .total-section { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin-top: 20px;
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 8px;
          font-size: 14px;
        }
        .total-row.final { 
          font-size: 18px; 
          font-weight: bold; 
          color: #667eea; 
          border-top: 2px solid #dee2e6; 
          padding-top: 10px; 
          margin-top: 10px;
        }
        .address-box { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #667eea;
        }
        .footer { 
          background: #333; 
          color: white; 
          padding: 20px; 
          text-align: center; 
          font-size: 12px;
        }
        .btn { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #667eea; 
          color: white; 
          text-decoration: none; 
          border-radius: 25px; 
          margin-top: 15px;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; }
          .content { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Zyva Designs</h1>
          <div class="status-badge">${statusText}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h3>Order Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Order Number</div>
                <div class="info-value">${orderNumber}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Order Date</div>
                <div class="info-value">${new Date().toLocaleDateString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Payment Status</div>
                <div class="info-value" style="color: ${statusColor}; font-weight: bold;">${statusText}</div>
              </div>
              ${paymentDetails.transactionId ? `
              <div class="info-item">
                <div class="info-label">Transaction ID</div>
                <div class="info-value">${paymentDetails.transactionId}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <h3>Customer Details</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${customerDetails.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${customerDetails.email}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${customerDetails.phone || 'N/A'}</div>
              </div>
            </div>
          </div>

          ${orderDetails.shippingAddress ? `
          <div class="section">
            <h3>Shipping Address</h3>
            <div class="address-box">
              ${orderDetails.shippingAddress.addressLine}<br>
              ${orderDetails.shippingAddress.apartment ? orderDetails.shippingAddress.apartment + '<br>' : ''}
              ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state}<br>
              ${orderDetails.shippingAddress.country} ${orderDetails.shippingAddress.zipCode || ''}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h3>Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.name}</strong>
                      ${item.selectedColor ? `<br><small>Color: ${item.selectedColor}</small>` : ''}
                      ${item.selectedSize ? `<br><small>Size: ${item.selectedSize}</small>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td>AED ${item.price.toFixed(2)}</td>
                    <td>AED ${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
                ${orderDetails.isGiftWrapped ? `
                <tr>
                  <td><strong>Gift Wrapping</strong><br><small>${orderDetails.giftMessage || 'Gift wrapping service'}</small></td>
                  <td>1</td>
                  <td>AED 30.00</td>
                  <td>AED 30.00</td>
                </tr>
                ` : ''}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>Payment Summary</h3>
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>AED ${totals.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>VAT:</span>
                <span>AED ${totals.vatAmount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Shipping:</span>
                <span>AED 0.00</span>
              </div>
              ${orderDetails.isGiftWrapped ? `
              <div class="total-row">
                <span>Gift Wrap:</span>
                <span>AED 30.00</span>
              </div>
              ` : ''}
              ${totals.couponDiscount > 0 ? `
              <div class="total-row" style="color: #28a745;">
                <span>Coupon Discount (${orderDetails.couponCode}):</span>
                <span>-AED ${totals.couponDiscount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-row final">
                <span>Total Amount:</span>
                <span>AED ${totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${paymentStatus === 'failed' ? `
          <div class="section" style="text-align: center;">
            <p style="color: #dc3545; font-weight: bold;">Your payment could not be processed. Please try again or contact support.</p>
            <a href="${process.env.CLIENT_URL}/checkout" class="btn">Try Again</a>
          </div>
          ` : paymentStatus === 'pending' ? `
          <div class="section" style="text-align: center;">
            <p style="color: #ffc107; font-weight: bold;">Your payment is being processed. We'll notify you once it's completed.</p>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Zyva Designs. All rights reserved.</p>
          <p>For support, contact us at support@zyvadesigns.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send receipt email
const sendReceiptEmail = async (to, subject, receiptData) => {
  try {
    const htmlContent = generateReceiptHTML(receiptData);
    
    const mailOptions = {
      from: `"Zyva Designs" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: [] // You can add PDF receipts here if needed
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Receipt email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return { success: false, error: error.message };
  }
};

// Generate different receipt types
const sendPaymentCreatedReceipt = async (customerEmail, orderData, paymentSessionData) => {
  const receiptData = {
    orderDetails: orderData,
    paymentStatus: 'pending',
    customerDetails: {
      name: orderData.customerName || 'Customer',
      email: customerEmail,
      phone: orderData.customerPhone
    },
    items: orderData.items.map(item => ({
      name: item.name || item.productId?.title || 'Product',
      quantity: item.quantity,
      price: item.price,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize
    })),
    totals: {
      subtotal: orderData.subtotal,
      vatAmount: orderData.vatAmount,
      couponDiscount: orderData.couponDiscount || 0,
      totalAmount: orderData.totalAmount
    },
    orderNumber: orderData.orderNumber,
    paymentDetails: {
      transactionId: paymentSessionData.id
    }
  };

  return await sendReceiptEmail(
    customerEmail,
    `Order Confirmation - ${orderData.orderNumber}`,
    receiptData
  );
};

const sendPaymentStatusReceipt = async (customerEmail, orderData, paymentStatus, transactionDetails = {}) => {
  const receiptData = {
    orderDetails: orderData,
    paymentStatus: paymentStatus,
    customerDetails: {
      name: orderData.customerName || orderData.name || 'Customer',
      email: customerEmail,
      phone: orderData.customerPhone || orderData.phone
    },
    items: orderData.items.map(item => ({
      name: item.name || item.productId?.title || 'Product',
      quantity: item.quantity,
      price: item.price,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize
    })),
    totals: {
      subtotal: orderData.subtotal,
      vatAmount: orderData.vatAmount,
      couponDiscount: orderData.couponDiscount || 0,
      totalAmount: orderData.totalAmount
    },
    orderNumber: orderData.orderNumber,
    paymentDetails: transactionDetails
  };

  const subjectMap = {
    'paid': `Payment Successful - ${orderData.orderNumber}`,
    'failed': `Payment Failed - ${orderData.orderNumber}`,
    'pending': `Payment Pending - ${orderData.orderNumber}`,
    'processing': `Payment Processing - ${orderData.orderNumber}`
  };

  return await sendReceiptEmail(
    customerEmail,
    subjectMap[paymentStatus] || `Payment Update - ${orderData.orderNumber}`,
    receiptData
  );
};

module.exports = {
  sendReceiptEmail,
  sendPaymentCreatedReceipt,
  sendPaymentStatusReceipt,
  generateReceiptHTML
};