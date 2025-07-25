var express = require('express');
var router = express.Router();
const Controller = require('../controller/product')
const Product = require('../models/products');
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const multerS3 = require('multer-s3');
const s3Client = require('../config/s3');

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = Date.now().toString() + "-" + file.originalname;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).fields([
  { name: "images", maxCount: 10 },
  { name: "coverimage", maxCount: 1 },
  { name: "sizechart", maxCount: 1 },
]);


router.post('/', upload, Controller.create);
router.get('/',Controller.getAll)
router.get('/:id',Controller.get)
router.put('/:id',upload,Controller.update)
router.delete('/:id',Controller.deleteProduct)
router.get('/category/products', Controller.getProductsByCategory);
router.get('/newarrivals/products', Controller.getRecentProducts);
router.get("/random/products",Controller.RandomProducts)
router.get('/tag/products', Controller.getProductsByTag);
router.get('/subcategory/products', Controller.getProductsBySubcategory);
// Deduct product stock when order product
router.put('/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { size, quantity } = req.body; 

  try {
    const product = await Product.findById(id);
    const sizeObject = product.sizes.find(s => s.size === size);
    if (sizeObject) {
      if (sizeObject.stock >= quantity) {
        sizeObject.stock -= quantity;
        await product.save(); 
        res.status(200).send({ message: 'Stock updated successfully' });
      } else {
        res.status(400).send({ message: 'Not enough stock available' });
      }
    } else {
      res.status(404).send({ message: 'Size not found' });
    }
  } catch (error) {
    console.error("Error updating stock", error);
    res.status(500).send({ message: 'Server error' });
  }
});
//product update to sold out false to true
router.put('/update/:id', Controller.updateSoldOut)
//product update to sold out true to false
router.put('/falseupdate/:id', Controller.updateSoldIn)

module.exports = router;
