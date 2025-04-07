var express = require('express');
var router = express.Router();
var Controller = require('../controller/favorites');

//whish list routes
router.post('/',Controller.create)
router.get("/customers/:customerId",Controller.getWhishlistByCustomerId);
router.delete('/:id',Controller.delete)
// Clear customer wishlist
router.delete('/clear/:customerId',Controller.clearWishlist)
// Check if item exists in customer's wishlist
router.get('/check/product', Controller.checkProductInWishlist);

module.exports = router;
