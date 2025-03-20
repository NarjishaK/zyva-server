var express = require('express');
var router = express.Router();
const Controller = require('../controller/notification')

router.put('/orders/:orderId', Controller.updateDeliveryStatus);
router.get('/', Controller.getAll);
router.delete('/:id', Controller.delete);


//return routes
router.post('/return-request',Controller.saveReturnRequest);
router.get('/requests',Controller.getAllRequests);
router.delete('/requests/:id', Controller.deleteRequest);
module.exports = router;
