// controllers/shoppingBagController.js
const ShoppingBag = require("../models/shoppingbag")


// Add products to the shopping bag
exports.addToBag = async (req, res) => {
  const { adminId, products } = req.body;

  try {
    let bag = await ShoppingBag.findOne({ adminId });

    // If the shopping bag exists, update it. If not, create a new one.
    if (bag) {
      products.forEach((newProduct) => {
        const existingProduct = bag.products.find(p => p.productId.toString() === newProduct.productId);
        if (existingProduct) {
          existingProduct.quantity += newProduct.quantity;
        } else {
          bag.products.push(newProduct);
        }
      });
    } else {
      bag = new ShoppingBag({
        adminId,
        products,
      });
    }
    await bag.save();
    return res.status(200).json({ message: 'Products added to the shopping bag', bag });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add products to the shopping bag', error });
  }
};

// Get shopping bag for a specific user
exports.getBag = async (req, res) => {
  const { adminId } = req.params;

  try {
    const bag = await ShoppingBag.findOne({ adminId }).populate('products.productId');

    if (!bag) {
      return res.status(404).json({ message: 'No shopping bag found' });
    }

    return res.status(200).json(bag);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching shopping bag', error });
  }
};

//remove a product from the shopping bag
exports.removeFromCart = async (req, res) => {
    const { adminId, productId } = req.params;
  
    try {
      const updatedCart = await ShoppingBag.findOneAndUpdate(
        { adminId },
        { $pull: { products: { productId } } },
        { new: true } 
      );
  
      if (!updatedCart) {
        return res.status(404).json({ message: "Cart not found" });
      }
  
      res.status(200).json({ message: "Product removed from cart", cart: updatedCart });
    } catch (error) {
      console.error("Error removing product from cart", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };