var express = require('express');
var router = express.Router();
const Controller = require('../controller/supplier')

//supplier routes
router.post('/',Controller.create)
router.get('/',Controller.getAll)
router.get('/:id',Controller.get)
router.put('/:id',Controller.update)
router.delete('/:id',Controller.delete)
router.delete('/',Controller.deleteAll)
router.get('/search/suggest',Controller.getSupplierSuggestions)

module.exports = router;
