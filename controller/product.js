const asyncHandler = require("express-async-handler");
const Product = require("../models/products");
const ShoppingBag = require("../models/shoppingbag");
const Customercart = require("../models/customercart");
const WhishList = require("../models/favorites");
const CustomerOrder = require("../models/customerorder")
const mongoose = require('mongoose');


// Function to generate new product ID
const generateProductId = async () => {
  const lastProduct = await Product.findOne().sort({ createdAt: -1 }); // Find the last product by creation time
  let newProductId = "PR-ID0000001"; 

  if (lastProduct && lastProduct.productId) {
    const lastNumericId = parseInt(lastProduct.productId.replace("PR-ID", ""));
    const nextId = (lastNumericId + 1).toString().padStart(7, "0");
    newProductId = `PR-ID${nextId}`;
  }

  return newProductId;
};
//create product
exports.create = asyncHandler(async (req, res) => {
  try {
    // Generate the new product ID
    const newProductId = await generateProductId();

    // Safely parse sizes
    let sizes = [];
    try {
      sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sizes format',
        details: parseError.message
      });
    }

    const images = req.files["images"]
      ? req.files["images"].map((file) => file.filename)
      : [];
    const coverImage = req.files["coverimage"]
      ? req.files["coverimage"][0].filename
      : null; 

    const productData = {
      mainCategory: req.body.mainCategory,
      coverimage: coverImage,
      subCategory: req.body.subCategory,
      price: parseFloat(req.body.price),
      productId: newProductId,
      modelNo: req.body.modelNo,
      title: req.body.title,
      description: req.body.description,
      images: images,
      color: req.body.color,
      returnpolicy: req.body.returnpolicy,
      tag: req.body.tag,
      sizes: sizes.map((size) => ({
        size: size.value,
        stock: size.stock,
        selected: true,
      })),
    };

    // Validate required fields
    const requiredFields = ['mainCategory', 'title', 'price'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }

    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Product Creation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
//get all products
exports.getAll = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.status(200).json(products);
});

//get by Id
exports.get = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.status(200).json(product);
});

//update product
exports.update = asyncHandler(async (req, res) => {
  try {
    const updates = req.body;
    if (updates.sizes) {
      updates.sizes = JSON.parse(updates.sizes);
    }
    if (req.files) {
      if (req.files.images) {
        updates.images = req.files.images.map((file) => file.filename);
      }
      if (req.files.coverimage) {
        updates.coverimage = req.files.coverimage[0].filename;
      }
    }
    const updateObject = {};
    if (updates.sizes) {
      const sizeObject = {};
      updates.sizes.forEach((size) => {
        sizeObject[size.size] = {
          size: size.size,
          stock: size.stock,
        };
      });
      updateObject.sizes = Object.values(sizeObject);
    }
    Object.keys(updates).forEach((key) => {
      if (key !== "sizes") {
        updateObject[key] = updates[key];
      }
    });
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
});


// delete product
exports.deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete the product
    await Product.findByIdAndDelete(req.params.id);

    // Remove the product from related collections
    await Promise.all([
      ShoppingBag.updateMany({}, { $pull: { products: { productId: product._id } } }),
      WhishList.deleteMany({ productId: product._id }),
      Customercart.deleteMany({ productId: product._id }),
      // CustomerOrder.deleteMany({ productId: product._id }),
    ]);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});


// delete product
// exports.deleteProduct = asyncHandler(async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const product = await Product.findByIdAndDelete(req.params.id, { session });

//     if (!product) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Remove the product from all shopping bags by its product ID
//     await ShoppingBag.updateMany(
//       {},
//       { $pull: { products: { productId: product._id } } },
//       { session }
//     );

//     // Remove all wishlist entries with the product ID
//     await WhishList.deleteMany({ productId: product._id }, { session });

//     // Remove all cart entries with the product ID
//     await Customercart.deleteMany({ productId: product._id }, { session });

//     // Remove all customer orders with the product ID
//     await CustomerOrder.deleteMany({ productId: product._id }, { session });

//     // await session.commitTransaction();
//     // session.endSession();

//     res.status(200).json({ message: "Product deleted successfully" });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Error deleting product:", error);
//     res.status(500).json({ message: "Failed to delete product" });
//   }
// });

//fetch products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const categoryName = req.query.category;
        console.log('Received request for category:', categoryName);
        
        if (!categoryName) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const products = await Product.find({ mainCategory: categoryName });
        console.log('Found products:', products);
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for this category' });
        }

        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};