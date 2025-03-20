var express = require('express');
var router = express.Router();
const SubController = require('../controller/subcategory')
const SubCategory = require('../models/subcategory')


//filter by category
router.get('/subcategory', async (req, res) => {
    try {
      const { category } = req.query;
      let subcategories;
      
      if (category) {
        subcategories = await SubCategory.find({ category });
      } else {
        subcategories = await SubCategory.find();
      }
      
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
//sub category routes
router.post('/',SubController.create)
router.get('/',SubController.getAll)
router.get('/:id',SubController.get)
router.put('/:id',SubController.update)
router.delete('/:id',SubController.delete)
module.exports = router;
