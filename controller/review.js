const Review = require("../models/review");

const reviewController = {
  // Create a new review
  createReview: async (req, res) => {
    try {
      const { productId, customerId, rating, review } = req.body;
      const newReview = new Review({
        productId,
        customerId,
        rating: Number(rating),
        review,
        image: req.file ? req.file.filename : null,
      });

      await newReview.save();

      res.status(201).json({
        success: true,
        message: "Review added successfully",
        review: newReview,
      });
    } catch (error) {
      console.error("Error in createReview:", error);
      res.status(500).json({
        success: false,
        message: "Error adding review",
        error: error.message,
      });
    }
  },

  // Get all reviews for a product
  getProductReviews: async (req, res) => {
    try {
      const { productId } = req.params;
      
      const reviews = await Review.find({ productId })
        .populate("customerId", "name email") // Only get name and email from customer
        .sort({ _id: -1 }); // Sort by newest first

      res.status(200).json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error("Error in getProductReviews:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching reviews",
        error: error.message,
      });
    }
  },

  // Update a review
  updateReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { rating, review } = req.body;

      const updatedReview = await Review.findById(reviewId);

      if (!updatedReview) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      // Check if the review belongs to the customer
      if (updatedReview.customerId.toString() !== req.body.customerId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this review",
        });
      }

      // Update fields
      updatedReview.rating = rating || updatedReview.rating;
      updatedReview.review = review || updatedReview.review;
      
      // Update image if new one is uploaded
      if (req.file) {
        updatedReview.image = req.file.filename;
      }

      await updatedReview.save();

      res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review: updatedReview,
      });
    } catch (error) {
      console.error("Error in updateReview:", error);
      res.status(500).json({
        success: false,
        message: "Error updating review",
        error: error.message,
      });
    }
  },

  // Delete a review
  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const review = await Review.findById(reviewId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      await Review.findByIdAndDelete(reviewId);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteReview:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting review",
        error: error.message,
      });
    }
  },
//get all review
getAllReviews: async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error in getAllReviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
}
  // Get review statistics for a product
//   getReviewStats: async (req, res) => {
//     try {
//       const { productId } = req.params;
      
//       const stats = await Review.aggregate([
//         { $match: { productId: mongoose.Types.ObjectId(productId) } },
//         {
//           $group: {
//             _id: null,
//             averageRating: { $avg: "$rating" },
//             totalReviews: { $sum: 1 },
//             ratingCounts: {
//               $push: "$rating"
//             }
//           }
//         }
//       ]);

//       if (stats.length === 0) {
//         return res.status(200).json({
//           success: true,
//           stats: {
//             averageRating: 0,
//             totalReviews: 0,
//             ratingDistribution: {
//               5: 0, 4: 0, 3: 0, 2: 0, 1: 0
//             }
//           }
//         });
//       }

//       // Calculate rating distribution
//       const ratingDistribution = stats[0].ratingCounts.reduce((acc, rating) => {
//         acc[rating] = (acc[rating] || 0) + 1;
//         return acc;
//       }, {});

//       res.status(200).json({
//         success: true,
//         stats: {
//           averageRating: Math.round(stats[0].averageRating * 10) / 10,
//           totalReviews: stats[0].totalReviews,
//           ratingDistribution
//         }
//       });
//     } catch (error) {
//       console.error("Error in getReviewStats:", error);
//       res.status(500).json({
//         success: false,
//         message: "Error fetching review statistics",
//         error: error.message,
//       });
//     }
//   }
};

module.exports = reviewController;