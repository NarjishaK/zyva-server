const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  adminName: String,
  totalAmount: {
    type: Number,
    required: true,
  },
  customerName: String,
  email: String,
  phone: String,
  address: String,
  // shopName: String,
 
  orderStatus: {
    type: String,
    enum: ["Packing", "Delivered", "Cancelled"],
    default: "Packing",
  },
  paymentMethod: {
    type: String,
    enum: ["Cash on delivery", "UPI",],
    default: "Cash on delivery",
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  balanceAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Paid", "Refund","Partially Paid"],
    default: "Unpaid",
  },
  deliveryStatus: {
    type: String,
    enum: ["Out for delivery", "Delivered", "Cancelled","On transist","Pending"],
    default: "Pending",
  },
  orderDate: {
    type: Date,
  },
  deliveryDate: {
    type: Date,
  },
  note: {
    type: String,
  },
  products: [{
    type: new Schema({
      id: String,
      mainCategory: String,
      color: String,
      price: Number,
      quantity: Number,
      size: String,
      coverImage: String,
    }),
    required: true
  }],
});

module.exports = mongoose.model("SalesOrder", OrderSchema);
