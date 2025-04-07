var express = require('express');
var router = express.Router();
var Controller = require('../controller/customercart');
const customercart = require('../models/customercart');

//customer cart  routes
router.post('/',Controller.create)
router.get("/:customerId",Controller.getByCustomerId);
router.delete('/:id',Controller.delete)

//updateCartItem
router.put('/:cartItemId',Controller.updateCartItem)
// Clear customer cart
router.delete('/clear/:customerId',Controller.clearCart)
// Remove item from cart
router.delete('/remove/:cartItemId',Controller.removeCartItem)
router.get('/check/product', async (req, res) => {
    try {
      const { customerId, productId, selectedProductColor, selectedProductSize } = req.query;
      
      const cartItem = await customercart.findOne({
        customerId,
        productId,
        selectedProductColor,
        selectedProductSize
      });
      
      if (cartItem) {
        res.status(200).json({ exists: true, cartItem });
      } else {
        res.status(200).json({ exists: false, cartItem: null });
      }
    } catch (error) {
      res.status(500).json({ message: "Error checking cart item", error: error.message });
    }
  });
module.exports = router;
