// models/ShippingTax.js
const mongoose = require("mongoose");

const shippingTaxSchema = new mongoose.Schema({
    country: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String },
    shippingRate: { type: Number, default: 0 }, // in AED or preferred currency
    taxRate: { type: Number, default: 0 }, // in percentage (e.g., 5 means 5%)
    total: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save hook to calculate total based on shipping and tax rates
shippingTaxSchema.pre('save', function(next) {
    this.total = this.shippingRate + (this.shippingRate * (this.taxRate / 100));
    next();
});

module.exports = mongoose.model("ShippingTax", shippingTaxSchema);