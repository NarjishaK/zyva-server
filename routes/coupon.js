var express = require('express');
var router = express.Router();
const controller = require('../controller/coupon')

router.post('/',controller.create)
router.get('/',controller.getAll)
router.get('/:id',controller.get)
router.put('/:id',controller.update)
router.delete('/:id',controller.delete)
router.get('/product/:productId', controller.getCouponsByProductId);

module.exports = router;
