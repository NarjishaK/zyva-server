const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true
    },
    expirationDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
    },
    apply: {
        type: Boolean,
        default: false
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        }
    ]
});

// Middleware to check and update status before saving
couponSchema.pre('save', function (next) {
    if (this.expirationDate < Date.now()) {
        this.status = 'inactive';
    }
    next();
});

module.exports = mongoose.model('Coupon', couponSchema);
