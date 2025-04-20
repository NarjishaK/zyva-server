const mongoose = require("mongoose");

const orderedProductSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  shippingaddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShippingTax",
  },
  cartItem: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomerCart",
    required: true,
  }],

  orderNumber: {
    type: String,
    // required: true,
    unique: true,
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  tax: Number,
  isGiftWrapped: {
    type: Boolean,
    default: false,
  },
  giftMessage: String,
  giftWrapFee: {
    type: Number,
    default: 0
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  customerNote: String,

  // Order Status Information
  orderDate: {
    type: Date,
    default: Date.now,
  },
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
  statusHistory: [
    {
      status: {
        type: String,
        enum: [
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "returned",
        ],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
    },
  ],
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
    default: "pending",
  },
  paidAmount: {
    type: Number,
    default: 0,
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
  subtotal: {
    type: Number,
    required: true,
  },
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,

  // Return Information
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

  // Refund Information
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundStatus: {
    type: String,
    enum: ["not_requested", "processing", "completed", "declined"],
    default: "not_requested",
  },
  refundTransactionId: String,

  // Invoice
  invoiceNumber: String,
  invoiceUrl: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  totalAmount: {
    type: Number,
    required: true
  },
});

// Pre-save hook to auto-generate order number if not provided
orderedProductSchema.pre("save", function (next) {
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
orderedProductSchema.methods.isReturnEligible = function () {
  if (!this.returnEligible) return false;

  const now = new Date();
  const deliveryDate = this.actualDeliveryDate || null;

  if (!deliveryDate) return false;

  const daysSinceDelivery = Math.floor(
    (now - deliveryDate) / (1000 * 60 * 60 * 24)
  );
  return daysSinceDelivery <= this.returnPeriod;
};

// Method to calculate refund amount
orderedProductSchema.methods.calculateRefundAmount = function (returnedItems) {
  // If no specific items provided, assume full order refund
  if (!returnedItems || returnedItems.length === 0) {
    return this.totalAmount;
  }

  // Calculate refund for specific items
  let refundAmount = 0;
  returnedItems.forEach((item) => {
    const orderItem = this.products.find(
      (p) => p._id.toString() === item.productId.toString()
    );
    if (orderItem) {
      refundAmount += orderItem.price * item.quantity;
    }
  });

  return refundAmount;
};

// Create and export the model
const OrderDetails = mongoose.model("OrderDetails", orderedProductSchema);
module.exports = OrderDetails;