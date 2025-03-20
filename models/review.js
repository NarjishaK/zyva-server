const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    image:{
        type: String
    },
    rating: {
        type: Number,
        required: true
    },
    review: {
        type: String
    }
});

module.exports = mongoose.model("Review", reviewSchema);