const Modal = require("../models/coupon");
const Product = require("../models/products");
const MainCategory = require("../models/maincategory");

exports.create= async (req, res) => {
    try {
        // Log the incoming data for debugging
        console.log("Creating coupon with data:", req.body);
        
        // Create the coupon
        const data = await Modal.create(req.body);
        
        console.log("Coupon created successfully:", data);
        res.status(201).json(data);
    } catch (error) {
        console.error("Error creating coupon:", error);
        
        // Better error handling
        if (error.code === 11000) {
            // Duplicate key error (likely the code field)
            return res.status(400).json({ 
                message: "Coupon code already exists. Please use a different code." 
            });
        }
        
        if (error.name === 'ValidationError') {
            // Format mongoose validation errors
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                message: "Validation error", 
                details: messages 
            });
        }
        
        // For any other errors
        res.status(500).json({ message: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const data = await Modal.find().populate('applicableCategory').populate('applicableProducts');
        res.json(data);
    } catch (error) {
        res.json({ message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const data = await Modal.findByIdAndDelete(req.params.id);
        res.json(data);
    } catch (error) {
        res.json({ message: error.message });
    }
};

exports.get = async (req, res) => {
    try {
        const data = await Modal.findById(req.params.id).populate('applicableCategory').populate('applicableProducts');
        res.json(data);
    } catch (error) {
        res.json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = await Modal.findByIdAndUpdate(req.params.id, req.body);
        res.json(data);
    } catch (error) {
        res.json({ message: error.message });
    }
};

exports.getCouponsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;

        // Find coupons that include the given product ID
        const coupons = await Modal.find({ products: productId });

        if (!coupons.length) {
            return res.status(404).json({ message: 'No coupons found for this product.' });
        }

        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// GET /api/coupons/available/:productId
  
exports.getAvailableCouponsByProductId = async (req, res) => {
    const { productId } = req.params;
  
    try {
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Manually fetch the main category object using its name
      const mainCategory = await MainCategory.findOne({ name: product.mainCategory });
  
      const coupons = await Modal.find({
        status: 'active',
        expirationDate: { $gte: new Date() },
        $or: [
          { applicableTo: 'all' },
          {
            applicableTo: 'category',
            applicableCategory: mainCategory?._id, // Only if category matched
          },
          {
            applicableTo: 'product',
            applicableProducts: product._id,
          },
        ],
      });
  
      res.json(coupons);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      res.status(500).json({ error: 'Failed to fetch coupons' });
    }
  };
  