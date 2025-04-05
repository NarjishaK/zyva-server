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




// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const {cartItemId} = req.params;
    const { quantity } = req.body;
    
    const cartItem = await CustomerCart.findById(cartItemId);
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    cartItem.quantity = quantity;
    await cartItem.save();
    
    res.json(cartItem);
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
  try {
    const {cartItemId} = req.params;
    
    const cartItem = await CustomerCart.findByIdAndDelete(cartItemId);
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear customer cart
exports.clearCart = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    
    await CustomerCart.deleteMany({ customerId });
    
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: 'Server error' });
  }
};