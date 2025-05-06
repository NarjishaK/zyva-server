const mongoose = require("mongoose");

// OrderProduct Schema
const orderProductSchema = new mongoose.Schema({
  // Customer Details
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Order Items
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    selectedColor: String,
    selectedSize: String,
    image: String,
  }],
  
  // Address Details
  shippingAddress: {
    label: String,
    addressLine: { type: String, required: true },
    apartment: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: String,
  },
  
  // Order Details
  orderNumber: {
    type: String,
    unique: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  shippingFee: {
    type: Number,
    default: 0,
  },
  vatAmount: {
    type: Number,
    default: 0,
  },
  isGiftWrapped: {
    type: Boolean,
    default: false,
  },
  giftMessage: String,
  giftWrapFee: {
    type: Number,
    default: 0,
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },
  couponCode: String,
  customerNote: String,
  totalAmount: {
    type: Number,
    required: true,
  },
  
  // Order Status
  orderStatus: {
    type: String,
    enum: [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ],
    default: "pending",
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  
  // Payment Details
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: [
      "credit_card",
      "debit_card",
      "paypal",
      "apple_pay",
      "google_pay",
      "bank_transfer",
      "cash_on_delivery",
    ],
    required: true,
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    cardLastFour: String,
    currency: {
      type: String,
      default: "AED",
    },
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  
  // Delivery Details
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Return & Refund Details
  returnRequested: {
    type: Boolean,
    default: false,
  },
  returnReason: String,
  returnStatus: {
    type: String,
    enum: [
      "not_requested",
      "requested",
      "approved",
      "declined",
      "received",
      "refunded",
    ],
    default: "not_requested",
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundStatus: {
    type: String,
    enum: ["not_requested", "processing", "completed", "declined"],
    default: "not_requested",
  },
  
  // Other Details
  invoiceNumber: String,
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
}, { timestamps: true });

// Pre-save hook to auto-generate order number if not provided
orderProductSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    // Generate a unique order number based on timestamp and random digits
    const timestamp = new Date().getTime().toString().substring(6); // last 4 digits of timestamp
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `ORD-${timestamp}${random}`;
  }

  // Add status change to history if status has changed
  if (this.isModified("orderStatus")) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: "Status updated",
    });
  }

  next();
});

// Method to check if order is eligible for return
orderProductSchema.methods.isReturnEligible = function () {
  // Default return period of 14 days
  const returnPeriod = 14;
  
  if (this.orderStatus !== "delivered") return false;

  const now = new Date();
  const deliveryDate = this.actualDeliveryDate || null;

  if (!deliveryDate) return false;

  const daysSinceDelivery = Math.floor(
    (now - deliveryDate) / (1000 * 60 * 60 * 24)
  );
  return daysSinceDelivery <= returnPeriod;
};

// Method to calculate refund amount
orderProductSchema.methods.calculateRefundAmount = function (returnedItems) {
  // If no specific items provided, assume full order refund
  if (!returnedItems || returnedItems.length === 0) {
    return this.totalAmount;
  }

  // Calculate refund for specific items
  let refundAmount = 0;
  returnedItems.forEach((item) => {
    const orderItem = this.items.find(
      (p) => p.productId.toString() === item.productId.toString()
    );
    if (orderItem) {
      refundAmount += orderItem.price * item.quantity;
    }
  });

  return refundAmount;
};

// Create and export the model
const OrderProduct = mongoose.model("OrderProduct", orderProductSchema);
module.exports = OrderProduct;