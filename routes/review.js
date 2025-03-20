const express = require("express");
const router = express.Router();
const reviewController = require("../controller/review");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });;

// Create a new review
router.post(
  "/",
  upload.single("image"),
  reviewController.createReview
);

// Get all reviews for a product
router.get(
  "/:productId",
  reviewController.getProductReviews
);

// Update a review
router.put(
  "/:reviewId",
  upload.single("image"),
  reviewController.updateReview
);

// Delete a review
router.delete(
  "/:reviewId",
  reviewController.deleteReview
);

//get all reviews
router.get(
  "/",
  reviewController.getAllReviews
);
// Get review statistics for a product
// router.get(
//   "/stats/:productId",
//   reviewController.getReviewStats
// );

module.exports = router;