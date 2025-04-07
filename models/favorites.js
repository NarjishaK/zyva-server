const mongoose = require('mongoose');

const favoritesSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    selectedProductColor: {
        type: String,
        required: true
      },
      selectedProductSize: {
        type: String,
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    });
    favoritesSchema.index({ customerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Favorites', favoritesSchema)