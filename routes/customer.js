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
router.post("/send-otp",Controller.sendOTP);
router.post("/verify-otp",Controller.verifyOTP);
router.post("/reset-password/password",Controller.resetPasswords);

router.post('/reset-password', Controller.resetPassword);
//change password
router.put('/changepassword/:customerId', Controller.changePassword);
//create addressbook customerby id
router.post('/addressbook/:customerId', Controller.createAddressBook);
//get addressbook
router.get('/addressbook/:customerId', Controller.getAddressBook);
//update addressbook
router.put('/:customerId/addressbook/:addressId', Controller.updateAddressBook);
//delete addressbook
router.delete('/:customerId/addressbook/:addressId', Controller.deleteAddressBook);
  
module.exports = router;
