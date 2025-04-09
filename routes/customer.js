var express = require('express');
var router = express.Router();
const Controller = require('../controller/customer')
//customer routes

router.post('/',Controller.create)
router.get('/',Controller.getAll)
router.get('/:id',Controller.get)
router.put('/:id',Controller.update)
router.delete('/:id',Controller.delete)
router.post('/login',Controller.login)
router.delete('/',Controller.deleteAll)
router.get('/search/suggest',Controller.getCustomerSuggestions)
router.post('/forgot-password',Controller.sendOTP);
router.post('/verify-otp', Controller.verifyOTP);
router.post('/reset-password', Controller.resetPassword);
//change password
router.put('/changepassword/:customerId', Controller.changePassword);
  
module.exports = router;
