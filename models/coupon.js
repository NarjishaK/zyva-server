const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'], // e.g., 20% off or ₹100 off
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true
    },
    minimumAmount: {
        type: Number,
        default: 0 // Minimum purchase to apply coupon
    },
    expirationDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: 1 // How many times a single user can use it
    },
    isFirstOrderOnly: {
        type: Boolean,
        default: false
    },
    applicableTo: {
        type: String,
        enum: ['all', 'category','product'],
        default: 'all'
    },
    applicableCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainCategory'
    },
    applicableProducts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Automatically inactivate coupon if expired
couponSchema.pre('save', function (next) {
    if (this.expirationDate < Date.now()) {
        this.status = 'inactive';
    }
    next();
});

module.exports = mongoose.model('Coupon', couponSchema);
