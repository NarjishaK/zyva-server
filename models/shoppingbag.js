// models/ShoppingBag.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShoppingBagSchema = new Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', 
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
      },
      size: {
        type: String, 
        required: true,
      },
      stock: {
        type: Number,  
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 0,  
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ShoppingBag', ShoppingBagSchema);
