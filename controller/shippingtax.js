// controllers/shippingTaxController.js
const ShippingTax = require('../models/shippingtax');

exports.create = async (req, res) => {
    try {
        const { country, state, postalCode, shippingRate, taxRate } = req.body;
        
        const newShippingTax = new ShippingTax({
            country,
            state,
            postalCode,
            shippingRate,
            taxRate
        });
        
        const savedShippingTax = await newShippingTax.save();
        
        res.status(201).json(savedShippingTax);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const shippingTaxes = await ShippingTax.find();
        res.status(200).json(shippingTaxes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const shippingTax = await ShippingTax.findById(req.params.id);
        if (!shippingTax) {
            return res.status(404).json({ message: 'Shipping and tax record not found' });
        }
        res.status(200).json(shippingTax);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getByLocation = async (req, res) => {
    try {
        const { country, state, postalCode } = req.query;
        
        const query = {};
        if (country) query.country = country;
        if (state) query.state = state;
        if (postalCode) query.postalCode = postalCode;
        
        const shippingTax = await ShippingTax.findOne(query);
        
        if (!shippingTax) {
            return res.status(404).json({ message: 'No shipping and tax information found for this location' });
        }
        
        res.status(200).json(shippingTax);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { country, state, postalCode, shippingRate, taxRate } = req.body;
        
        const updatedShippingTax = await ShippingTax.findByIdAndUpdate(
            req.params.id,
            { country, state, postalCode, shippingRate, taxRate },
            { new: true, runValidators: true }
        );
        
        if (!updatedShippingTax) {
            return res.status(404).json({ message: 'Shipping and tax record not found' });
        }
        
        res.status(200).json(updatedShippingTax);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const deletedShippingTax = await ShippingTax.findByIdAndDelete(req.params.id);
        
        if (!deletedShippingTax) {
            return res.status(404).json({ message: 'Shipping and tax record not found' });
        }
        
        res.status(200).json({ message: 'Shipping and tax record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.calculateShipping = async (req, res) => {
    try {
        const { country, state, postalCode, subtotal } = req.body;
        
        if (!country || !state) {
            return res.status(400).json({ message: 'Country and state are required' });
        }
        
        // Build the query to find the most specific rate
        const query = { country, state };
        if (postalCode) query.postalCode = postalCode;
        
        let shippingInfo = await ShippingTax.findOne(query);
        
        // If not found with postal code, try without it
        if (!shippingInfo && postalCode) {
            const { postalCode, ...queryWithoutPostal } = query;
            shippingInfo = await ShippingTax.findOne(queryWithoutPostal);
        }
        
        if (!shippingInfo) {
            return res.status(404).json({ message: 'No shipping information found for the provided location' });
        }
        
        const shippingCost = shippingInfo.shippingRate;
        const taxAmount = subtotal ? (subtotal * shippingInfo.taxRate / 100) : 0;
        const totalShipping = shippingCost + taxAmount;
        
        res.status(200).json({
            shippingCost,
            taxRate: shippingInfo.taxRate,
            taxAmount,
            totalShipping,
            total: subtotal ? subtotal + totalShipping : totalShipping
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};