// var express = require('express');
// var router = express.Router();
// const Controller = require("../controller/customerorder")
// const Order = require('../models/customerorder');
// const Product =require('../models/products');

// router.post("/",Controller.create);
// router.get("/:customerId",Controller.getOrderDetailsByCustomer)

// router.get("/:id",Controller.get)
// router.delete("/:id",Controller.delete)
// router.put("/:id", async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
//         new: true,
//         runValidators: true, 
//       });
  
//       if (!updatedOrder) {
//         return res.status(404).json({ message: "Order not found" });
//       }
  
//       res.status(200).json({ order: updatedOrder });
//     } catch (error) {
//       console.error("Error updating order:", error);
//       res.status(500).json({ message: "Internal Server Error", error });
//     }
//   });
  
  
// // Route to update order delivery status and deduct stocks
// router.put('/:id/delivered', async (req, res) => {
//     try {
//         const order = await Order.findById(req.params.id);
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         if (!order.products || order.products.length === 0) {
//             return res.status(400).json({ message: 'No products found in the order' });
//         }

//         for (const orderedProduct of order.products) {
//             const productId = orderedProduct.productDetails.id; // Changed from productId to id
//             const { size, quantity } = orderedProduct.sizeDetails;

//             const product = await Product.findById(productId);
//             if (!product) {
//                 return res.status(404).json({ message: `Product not found: ${productId}` });
//             }

//             const sizeIndex = product.sizes.findIndex(s => s.size === parseInt(size));
//             if (sizeIndex === -1) {
//                 return res.status(400).json({ message: `Size ${size} not found for product ${productId}` });
//             }

//             if (product.sizes[sizeIndex].stock < quantity) {
//                 return res.status(400).json({ message: `Insufficient stock for product ${productId}, size ${size}` });
//             }

//             // Deduct the stock
//             product.sizes[sizeIndex].stock -= quantity;
//             await product.save();
//         }

//         // Update order status
//         order.deliveryStatus = 'Delivered';
//         order.deliveryDate = new Date().toISOString();
//         await order.save();

//         res.status(200).json({ message: 'Order marked as delivered and stock updated', order });
//     } catch (error) {
//         console.error("Error updating order:", error);
//         res.status(500).json({ message: 'Error updating order', error: error.message });
//     }
// });
// // Route to handle order return and restore stock
// router.put('/:id/return', async (req, res) => {
//     try {
//         const order = await Order.findById(req.params.id);
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         if (order.deliveryStatus !== 'Delivered') {
//             return res.status(400).json({ message: 'Order must be delivered before it can be returned' });
//         }

//         if (order.return) {
//             return res.status(400).json({ message: 'Order has already been returned' });
//         }

//         for (const orderedProduct of order.products) {
//             const productId = orderedProduct.productDetails.id;
//             const { size, quantity } = orderedProduct.sizeDetails;

//             const product = await Product.findById(productId);
//             if (!product) {
//                 return res.status(404).json({ message: `Product not found: ${productId}` });
//             }

//             const sizeIndex = product.sizes.findIndex(s => s.size === parseInt(size));
//             if (sizeIndex === -1) {
//                 return res.status(400).json({ message: `Size ${size} not found for product ${productId}` });
//             }

//             // Restore the stock
//             product.sizes[sizeIndex].stock += quantity;
//             await product.save();
//         }

//         // Update order status
//         order.return = true;
//         order.deliveryStatus = 'Returned';
//         await order.save();

//         res.status(200).json({ message: 'Order returned and stock restored', order });
//     } catch (error) {
//         console.error("Error returning order:", error);
//         res.status(500).json({ message: 'Error returning order', error: error.message });
//     }
// });
  
// module.exports = router;



const express = require("express");
const router = express.Router();
const orderController = require("../controller/customerorder");
const  authenticateUser  = require("../middleware/auth"); // Assuming you have an auth middleware

// Create a new order
router.post("/", orderController.createOrder);
router.get("/",orderController.getAll)
// Get order by ID

// Get order by ID
router.get("/:id", authenticateUser, orderController.getOrderById);

// Get all orders for a customer
router.get("/customer/:customerId" , orderController.getCustomerOrders);

// Update order status
router.put("/:orderId/status", authenticateUser, orderController.updateOrderStatus);

// Update payment status
router.put("/:orderId/payment", authenticateUser, orderController.updatePaymentStatus);

// Cancel order
router.put("/:orderId/cancel", authenticateUser, orderController.cancelOrder);

// Clear cart after successful order
router.delete("/cart/:customerId", authenticateUser, orderController.clearCustomerCart);

module.exports = router;