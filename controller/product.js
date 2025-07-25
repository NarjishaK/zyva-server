const asyncHandler = require("express-async-handler");
const Product = require("../models/products");
const ShoppingBag = require("../models/shoppingbag");
const Customercart = require("../models/customercart");
const WhishList = require("../models/favorites");
const CustomerOrder = require("../models/order")
const mongoose = require('mongoose');

const s3Client = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

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
  ? req.files["images"].map((file) => file.location)
  : [];

const coverImage = req.files["coverimage"]
  ? req.files["coverimage"][0].location
  : null;

const sizechart = req.files["sizechart"]
  ? req.files["sizechart"][0].location
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


// update product
exports.update = asyncHandler(async (req, res) => {
  try {
    const updates = req.body;

    // Parse sizes if provided
    if (updates.sizes) {
      updates.sizes = JSON.parse(updates.sizes);
    }

    // Fetch the current product
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Track updated images
    let updatedImages = [];

    // Keep existing images
    let existingImages = [];
    if (req.body.existingImages) {
      existingImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      updatedImages = existingImages;
    }

    // Add new uploaded images (S3 URLs)
    if (req.files && req.files.images) {
      const newImages = req.files.images.map(file => file.location);
      updatedImages = [...updatedImages, ...newImages];
    }

    // 👇 Delete removed images from S3
    if (req.body.imagesToRemove) {
      const imagesToRemove = Array.isArray(req.body.imagesToRemove)
        ? req.body.imagesToRemove
        : [req.body.imagesToRemove];

      for (const imageUrl of imagesToRemove) {
        await deleteFromS3(imageUrl); // Make sure this function extracts the S3 key and deletes
      }
    }

    // Prepare the update object
    const updateObject = {
      images: updatedImages,
    };

    // Cover image update
    if (req.files && req.files.coverimage) {
      // 👇 Delete old cover image
      if (currentProduct.coverimage && req.body.existingCoverImage !== currentProduct.coverimage) {
        await deleteFromS3(currentProduct.coverimage);
      }
      updateObject.coverimage = req.files.coverimage[0].location;
    } else if (req.body.existingCoverImage) {
      updateObject.coverimage = req.body.existingCoverImage;
    }

    // Size chart update
    if (req.files && req.files.sizechart) {
      // 👇 Delete old size chart
      if (currentProduct.sizechart && req.body.existingSizeChart !== currentProduct.sizechart) {
        await deleteFromS3(currentProduct.sizechart);
      }
      updateObject.sizechart = req.files.sizechart[0].location;
    } else if (req.body.existingSizeChart) {
      updateObject.sizechart = req.body.existingSizeChart;
    }

    // Sizes
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

    // Include other fields
    Object.keys(updates).forEach((key) => {
      if (!["sizes", "existingImages", "imagesToRemove", "existingCoverImage", "existingSizeChart"].includes(key)) {
        updateObject[key] = updates[key];
      }
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
});




// delete product

// Delete object from S3
const deleteFromS3 = async (fileKeyOrUrl) => {
  const bucketName = process.env.S3_BUCKET_NAME;

  // Extract the filename if a URL is passed
  let fileKey = fileKeyOrUrl;
  if (fileKeyOrUrl.startsWith("http")) {
    const urlParts = new URL(fileKeyOrUrl);
    fileKey = decodeURIComponent(urlParts.pathname.replace(`/${bucketName}/`, "").replace(/^\//, ""));
  }

  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }));
    console.log(`✅ Deleted ${fileKey} from S3`);
  } catch (error) {
    console.error(`❌ Failed to delete ${fileKey} from S3:`, error.message);
  }
};

// Delete product logic
exports.deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete associated S3 files (coverimage, sizechart, images)
    if (product.coverimage) await deleteFromS3(product.coverimage);
    if (product.sizechart) await deleteFromS3(product.sizechart);
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await deleteFromS3(image);
      }
    }

    // Delete the product
    await Product.findByIdAndDelete(product._id);

    // Remove references in related collections
    await Promise.all([
      ShoppingBag.updateMany({}, { $pull: { products: { productId: product._id } } }),
      WhishList.deleteMany({ productId: product._id }),
      Customercart.deleteMany({ productId: product._id }),
      CustomerOrder.updateMany(
        { 'items.productId': product._id },
        { $pull: { items: { productId: product._id } } }
      ),
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