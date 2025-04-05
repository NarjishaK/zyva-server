const mongoose = require('mongoose');

const customerCartSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: { type: Number, default: 1 },
   selectedProductColor: String,   
  selectedProductSize: String, 
});

module.exports = mongoose.model('CustomerCart', customerCartSchema)