const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    usageCount: {
        type: Number,
        default: 0
    }
});

couponUsageSchema.index({ userId: 1, couponId: 1 }, { unique: true });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
