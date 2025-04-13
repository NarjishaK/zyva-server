var express = require('express');
var router = express.Router();
const controller = require('../controller/coupon')
const Applycoupon = require('../controller/couponusage')

router.post('/',controller.create)
router.get('/',controller.getAll)
router.get('/:id',controller.get)
router.put('/:id',controller.update)
router.delete('/:id',controller.delete)
router.get('/product/:productId', controller.getCouponsByProductId);
//availble coupon of product
router.get('/available/:productId', controller.getAvailableCouponsByProductId);

router.post('/apply-coupon',Applycoupon.applyCoupon);
module.exports = router;
