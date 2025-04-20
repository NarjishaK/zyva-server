const Coupon = require('../models/coupon');
const CouponUsage = require('../models/couponusage');
const Order = require('../models/customerorder'); // For checking first order
const Product = require('../models/products'); // Added for product validation

exports.applyCoupon = async (req, res) => {
    try {
        const { code, userId, cartTotal, cartItems } = req.body;

        // Find the coupon and populate category if needed
        const coupon = await Coupon.findOne({ code, status: 'active' })
            .populate('applicableCategory')
            .populate('applicableProducts');
            
        if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon.' });

        if (new Date(coupon.expirationDate) < new Date()) {
            // Update status to inactive if expired
            await Coupon.findByIdAndUpdate(coupon._id, { status: 'inactive' });
            return res.status(400).json({ message: 'Coupon has expired.' });
        }

        if (cartTotal < coupon.minimumAmount) {
            return res.status(400).json({ message: `Minimum amount ₹${coupon.minimumAmount} required.` });
        }

        // Check if it's first order only
        if (coupon.isFirstOrderOnly) {
            const orderCount = await Order.countDocuments({ userId });
            if (orderCount > 0) {
                return res.status(400).json({ message: 'Coupon is valid only on your first order.' });
            }
        }

        // Check usage limit
        let usage = await CouponUsage.findOne({ userId, couponId: coupon._id });
        if (usage && usage.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'You have already used this coupon.' });
        }

        // Check if coupon is applicable to the products in cart
        if (coupon.applicableTo !== 'all') {
            // Get all products in the cart
            const productsInCart = cartItems.map(item => 
                typeof item.productId === 'object' ? item.productId._id.toString() : item.productId.toString()
            );
            
            let isApplicable = false;
            
            if (coupon.applicableTo === 'product') {
                // Check if any product in cart is in applicable products list
                const applicableProductIds = coupon.applicableProducts.map(p => p._id.toString());
                isApplicable = productsInCart.some(productId => 
                    applicableProductIds.includes(productId)
                );
                
                if (!isApplicable) {
                    return res.status(400).json({ 
                        message: 'This coupon is not applicable to any product in your cart.' 
                    });
                }
            } 
            else if (coupon.applicableTo === 'mainCategory') {
                // Need to check if products in cart belong to the applicable category
                // First get all products with their category info
                const productsWithCategories = await Product.find({
                    _id: { $in: productsInCart }
                }).select('mainCategory');
                
                // Check if any product belongs to the applicable category
                const categoryId = coupon.applicableCategory._id.toString();
                isApplicable = productsWithCategories.some(product => 
                    product.mainCategory && product.mainCategory.toString() === categoryId
                );
                
                if (!isApplicable) {
                    return res.status(400).json({ 
                        message: `This coupon is only applicable to ${coupon.applicableCategory.name} category.` 
                    });
                }
            }
        }

        // Apply discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (coupon.discountValue / 100) * cartTotal;
        } else {
            discount = coupon.discountValue;
        }

        // Limit discount to cart total
        discount = Math.min(discount, cartTotal);
        const newTotal = cartTotal - discount;

        // Update usage
        if (usage) {
            usage.usageCount += 1;
            await usage.save();
        } else {
            await CouponUsage.create({ userId, couponId: coupon._id, usageCount: 1 });
        }

        res.status(200).json({
            message: 'Coupon applied successfully!',
            discount,
            newTotal,
            couponDetails: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while applying coupon.' });
    }
};