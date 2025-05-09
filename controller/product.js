const asyncHandler = require("express-async-handler");
const Product = require("../models/products");
const ShoppingBag = require("../models/shoppingbag");
const Customercart = require("../models/customercart");
const WhishList = require("../models/favorites");
const CustomerOrder = require("../models/customerorder")
const mongoose = require('mongoose');
const e = require("express");


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
      const sizechart = req.files["sizechart"]
      ? req.files["sizechart"][0].filename
      : null;

    const productData = {
      mainCategory: req.body.mainCategory,
      coverimage: coverImage,
      sizechart: sizechart,
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
      ogPrice: req.body.ogPrice,
      origin: req.body.origin,
      vat: req.body.vat,
      requirements: req.body.requirements,
      beltinclude: req.body.beltinclude,
      headscarfinclude: req.body.headscarfinclude,
      material: req.body.material,
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
    
    // Handle sizes
    if (updates.sizes) {
      updates.sizes = JSON.parse(updates.sizes);
    }
    
    // Initialize the update object
    const updateObject = {};
    
    // Handle images to be removed
    const imagesToRemove = req.body.imagesToRemove;
    
    // Get the current product
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Update images - keep only images that are not in the imagesToRemove array
    let updatedImages = [];
    
    // Add existing images that weren't removed
    if (req.body.existingImages) {
      // Handle both single value and array
      const existingImages = Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : [req.body.existingImages];
        
      updatedImages = existingImages;
    }
    
    // Add new uploaded images
    if (req.files && req.files.images) {
      const newImages = Array.isArray(req.files.images) 
        ? req.files.images.map(file => file.filename) 
        : [req.files.images.filename];
        
      updatedImages = [...updatedImages, ...newImages];
    }
    
    updateObject.images = updatedImages;
    
    // Handle cover image
    if (req.files && req.files.coverimage) {
      updateObject.coverimage = req.files.coverimage[0].filename;
    } else if (req.body.existingCoverImage) {
      updateObject.coverimage = req.body.existingCoverImage;
    }
    
    // Handle size chart
    if (req.files && req.files.sizechart) {
      updateObject.sizechart = req.files.sizechart[0].filename;
    }else if (req.body.existingSizeChart) {
      updateObject.sizechart = req.body.existingSizeChart;
    }
    
    // Handle sizes
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
    
    // Add all other fields
    Object.keys(updates).forEach((key) => {
      if (key !== "sizes" && key !== "existingImages" && key !== "imagesToRemove" && key !== "existingCoverImage" && key !== "existingSizeChart") {
        updateObject[key] = updates[key];
      }
    });
    
    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If there were images to remove, you might want to delete the files from storage here
    // This requires file system access, which is not shown in this example
    
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
        // console.log('Received request for categosry:', categoryName);
        
        if (!categoryName) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const products = await Product.find({ mainCategory: categoryName });
        // console.log('Found products:', products);
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for this category' });
        }

        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};


//recent 8 products
exports.getRecentProducts=async(req,res)=>{
    try {
        const products = await Product.find().sort({ createdAt: -1 }).limit(8);
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
}

//random 8 products
exports.RandomProducts=async(req,res)=>{
    try {
        const products = await Product.aggregate().sample(8);
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
}

//products by tag
exports.getProductsByTag = async (req, res) => {
  try {
    const tagName = req.query.tag;
      if (!tagName) {
          return res.status(400).json({ message: 'tag name is required' });
      }
      const products = await Product.find({ tag: tagName });
      if (products.length === 0) {
          return res.status(404).json({ message: 'No products found for this tag' });
      }
      res.json(products);
  } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

//subcategory based products
exports.getProductsBySubcategory = async (req, res) => {
  try {
    const subcategoryName = req.query.subCategory;
    if (!subcategoryName) {
        return res.status(400).json({ message: 'Subcategory name is required' });
    }
    const products = await Product.find({ subCategory: subcategoryName });
    if (products.length === 0) {
        return res.status(404).json({ message: 'No products found for this subcategory' });
    }
    res.json(products);
} catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
}
};


//product update to sold out false to true
exports.updateSoldOut = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    res.status(200).json(product);
})

exports.updateSoldIn = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: false
    });
    res.status(200).json(product);
})