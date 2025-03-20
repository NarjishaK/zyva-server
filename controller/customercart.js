const CustomerCart = require("../models/customercart");
const asyncHandler = require("express-async-handler");

//customer cart  routes
exports.create = asyncHandler(async (req, res) => {
    const { customerId, productId } = req.body;
    if (!customerId || !productId) {
        return res.status(400).json({ message: "Please add all fields" });
    }
    const customerCart = await CustomerCart.create(req.body);
    res.status(200).json(customerCart);
})


exports.getByCustomerId = async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const customerCart = await CustomerCart.find({ customerId }).populate('productId');
      if (!customerCart) {
        return res.status(404).json({ message: 'Wishlist not found' });
      }
      res.json(customerCart);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: 'Server error' });
    }
  };


  //delete customer cart
  exports.delete = asyncHandler(async (req, res) => {
    const customerCart = await CustomerCart.findByIdAndDelete(req.params.id);
    res.status(200).json(customerCart);
})