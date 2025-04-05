var express = require('express');
var router = express.Router();
var Controller = require('../controller/customercart');

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

module.exports = router;
