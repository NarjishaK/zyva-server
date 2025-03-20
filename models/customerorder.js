const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerorderSchema = new Schema({
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
      shopName: String,
      orderStatus: {
        type: String,
        enum: ["Packing", "Delivered", "Cancelled"],
        default: "Packing",
      },
      paymentMethod: {
        type: String,
        enum: ["COD", "UPI"],
        default: "COD",
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
        enum: ["Unpaid", "Paid", "Refund", "Partially Paid"],
        default: "Unpaid",
      },
      deliveryStatus: {
        type: String,
        enum: ["Out for delivery", "Delivered", "Cancelled", "On transit", "Pending","Returned"],
        default: "Pending",
      },
      orderDate: {
        type: Date,
      },
      deliveryDate: {
        type: String,

      },
      note: {
        type: String,
      },
      Pincode: String,
      customerId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      products: [{
        productDetails: {
          id: String,
          mainCategory: String,
          subCategory: String,
          color: String,
          price: Number,
          coverImage: String,
          title: String,
        },
        sizeDetails: {
          sizeId: String,
          size: String,
          quantity: Number,
          totalAmount: Number,
        }
      }],
      return: {
        type: Boolean,
        default: false
    }
    });

module.exports = mongoose.model("CustomerOrder", customerorderSchema);
