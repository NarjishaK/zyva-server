// routes/shippingTaxRoutes.js
const express = require('express');
const router = express.Router();
const shippingTaxController = require('../controller/shippingtax');

// Create new shipping and tax record
router.post('/', shippingTaxController.create);

// Get all shipping and tax records
router.get('/', shippingTaxController.getAll);

// Get shipping and tax record by ID
router.get('/id/:id', shippingTaxController.getById);

// Get shipping and tax by location (country, state, postal code)
router.get('/location', shippingTaxController.getByLocation);

// Update shipping and tax record
router.put('/:id', shippingTaxController.update);

// Delete shipping and tax record
router.delete('/:id', shippingTaxController.delete);

// Calculate shipping and tax for a given location and order subtotal
router.post('/calculate', shippingTaxController.calculateShipping);

module.exports = router;