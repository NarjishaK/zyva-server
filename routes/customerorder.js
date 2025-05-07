// var express = require('express');
// var router = express.Router();
// const Controller = require("../controller/customerorder")
const Order = require('../models/order');
const Product =require('../models/products');

// router.post("/",Controller.create);
// router.get("/:customerId",Controller.getOrderDetailsByCustomer)

// router.get("/:id",Controller.get)

  
  
// module.exports = router;



const express = require("express");
const router = express.Router();
const orderController = require("../controller/customerorder");
  
// // Route to handle order return and restore stock
router.put('/:id/returns', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.orderStatus !== 'delivered') {
            return res.status(400).json({ message: 'Order must be delivered before it can be returned' });
        }

        if (order.return) {
            return res.status(400).json({ message: 'Order has already been returned' });
        }

        for (const orderedProduct of order.items) {
            const productId = orderedProduct.productId._id;
            // const { size, stock } = productId.sizes;

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${productId}` });
            }

            // const sizeIndex = product.sizes.findIndex(s => s.size === parseInt(size));
            // if (sizeIndex === -1) {
            //     return res.status(400).json({ message: `Size ${size} not found for product ${productId}` });
            // }

            // // Restore the stock
            // product.sizes[sizeIndex].stock += stock;
            await product.save();
        }

        // Update order status
        order.returnRequested = true;
        order.orderStatus = 'returned';
        await order.save();

        res.status(200).json({ message: 'Order returned and stock restored', order });
    } catch (error) {
        console.error("Error returning order:", error);
        res.status(500).json({ message: 'Error returning order', error: error.message });
    }
});

//update order details
router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true, 
      });
  
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.status(200).json({ order: updatedOrder });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
  });
// Create a new order
router.post("/", orderController.createOrder);
router.get("/",orderController.getAll)
// Get order by ID

// Get order by ID
router.get("/:id", orderController.getOrderById);

// Get all orders for a customer
router.get("/customer/:customerId" , orderController.getCustomerOrders);

router.post("/:orderId/return", orderController.requestReturn);
// Update order status
router.patch("/:orderId/status", orderController.updateOrderStatus);
router.patch("/:orderId/payment", orderController.updatePaymentStatus);
router.delete("/:id",orderController.delete)

// Cancel order

router.post("/:orderId/cancel", orderController.cancelOrder);
// Clear cart after successful order
router.delete("/cart/:customerId", orderController.clearCustomerCart);

// Route to update order delivery status and deduct stocks
router.put('/:id/delivered', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!order.products || order.products.length === 0) {
            return res.status(400).json({ message: 'No products found in the order' });
        }

        for (const orderedProduct of order.products) {
            const productId = orderedProduct.productDetails.id; // Changed from productId to id
            const { size, quantity } = orderedProduct.sizeDetails;

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${productId}` });
            }

            const sizeIndex = product.sizes.findIndex(s => s.size === parseInt(size));
            if (sizeIndex === -1) {
                return res.status(400).json({ message: `Size ${size} not found for product ${productId}` });
            }

            if (product.sizes[sizeIndex].stock < quantity) {
                return res.status(400).json({ message: `Insufficient stock for product ${productId}, size ${size}` });
            }

            // Deduct the stock
            product.sizes[sizeIndex].stock -= quantity;
            await product.save();
        }

        // Update order status
        order.deliveryStatus = 'Delivered';
        order.deliveryDate = new Date().toISOString();
        await order.save();

        res.status(200).json({ message: 'Order marked as delivered and stock updated', order });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
});
module.exports = router;