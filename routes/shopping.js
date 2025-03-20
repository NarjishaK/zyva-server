// routes/shoppingBag.js
const express = require('express');
const Controller = require('../controller/shoppingbag');
const router = express.Router();
const Authentication = require('../middleware/auth')
router.post('/',Controller.addToBag);
router.get('/:adminId', Controller.getBag);
router.delete('/:adminId/remove/:productId', Controller.removeFromCart);

module.exports = router;
