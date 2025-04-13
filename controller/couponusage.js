const Coupon = require('../models/coupon');
const CouponUsage = require('../models/couponusage');
const Order = require('../models/customerorder'); // For checking first order

exports.applyCoupon = async (req, res) => {
    try {
        const { code, userId, cartTotal } = req.body;

        const coupon = await Coupon.findOne({ code, status: 'active' });
        if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon.' });

        if (new Date(coupon.expirationDate) < new Date()) {
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
            newTotal
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while applying coupon.' });
    }
};
