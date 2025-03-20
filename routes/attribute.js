var express = require('express');
var router = express.Router();
const Controller = require('../controller/attribute')

//main category routes
router.post('/',Controller.create)
router.get('/:type',Controller.get)
router.get('/color', Controller.getColorAttributes);
router.get('/size', Controller.getSizeAttributes);
router.get('/tag', Controller.getTagAttributes);
router.delete('/tag/:id',Controller.deleteTag)
router.delete('/:id',Controller.delete)
router.delete('/size/:id',Controller.deleteSize)


module.exports = router;
