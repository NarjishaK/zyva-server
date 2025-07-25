const express = require('express');
const router = express.Router();
const multer = require("multer");
const Controller = require('../controller/influencer')

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
  { name: "image", maxCount: 1 },
]);


// influencer routes

router.post('/', upload, Controller.create);
router.get('/',Controller.getAll)
router.get('/:id',Controller.get)
// router.put('/:id',Controller.update)
router.delete('/:id',Controller.delete)
// router.delete('/',Controller.deleteAll)
// router.get('/search/suggest',Controller.getInfluencerSuggestions)
module.exports = router;