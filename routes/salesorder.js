const express = require('express');
const router = express.Router();
const Controller = require('../controller/salesorder');
const Order = require("../models/salesOrder");
const Product = require('../models/products'); // Assuming you have a Product model
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

router.post('/send-email',  Controller.sendEmail);
router.post('/', Controller.createOrder);
router.get('/', Controller.getOrders);
router.get('/:id', Controller.get);
router.delete('/:id', Controller.delete);
router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedOrder = req.body;
      if (!updatedOrder.products || !Array.isArray(updatedOrder.products)) {
        return res.status(400).json({ message: "Invalid products data" });
      }
      const originalOrder = await Order.findById(id);
      if (!originalOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Update product stock
      for (const newProduct of updatedOrder.products) {
        const originalProduct = originalOrder.products.find(p => p.id === newProduct.id);
        const quantityDifference = newProduct.quantity - (originalProduct ? originalProduct.quantity : 0);
  
        if (quantityDifference !== 0) {
          const product = await Product.findById(newProduct.id);
          if (!product) {
            return res.status(404).json({ message: `Product with id ${newProduct.id} not found` });
          }
  
          const sizeIndex = product.sizes.findIndex(s => s.size === parseInt(newProduct.size));
          if (sizeIndex === -1) {
            return res.status(400).json({ message: `Size ${newProduct.size} not found for product ${newProduct.id}` });
          }
  
          product.sizes[sizeIndex].stock -= quantityDifference;
  
          if (product.sizes[sizeIndex].stock < 0) {
            return res.status(400).json({ message: `Not enough stock for product ${newProduct.id} size ${newProduct.size}` });
          }
  
          await product.save();
        }
      }  
      // Update the order
      const updatedOrderDocument = await Order.findByIdAndUpdate(id, updatedOrder, { new: true });
  
      res.json(updatedOrderDocument);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  

module.exports = router;
