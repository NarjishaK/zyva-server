const Modal = require("../models/coupon");

exports.create= async (req, res) => {
    try {
        const data = await Modal.create(req.body);
        res.json(data);
    } catch (error) {
        res.json({ message: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const data = await Modal.find().populate('products');
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
        const data = await Modal.findById(req.params.id);
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
