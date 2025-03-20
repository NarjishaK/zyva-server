const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
    purchaseId: {
        type: String,
        unique: true,
        required: true,
    },
    adminName: String,
    totalAmount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    supplier: String,
    email: String,
    phone: String,
    address: String,
    shopName: String,
    item: String,
    PurchasedStatus: {
        type: String,
        enum: ["Item Received", "On the way", "Cancelled"],
        default: "Item Received",

    },
    paymentMethod: {
        type: String,
        enum: ["Cash", "UPI",],
        default: "Cash",
    },
    paidAmount: {
        type: Number,
        required: true,
    },
    paymentStatus: {
        type: String,
    },
    balance: {
        type: Number,
    },
});

module.exports = mongoose.model("Purchase", purchaseSchema)