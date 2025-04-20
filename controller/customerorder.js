// const CustomerOrder = require('../models/customerorder');

// // Generate unique orderId starting with CUT-ORID000001 format
// const generateOrderId = async () => {
//     const lastOrder = await CustomerOrder.findOne().sort({ _id: -1 }).limit(1);
//     let lastOrderId = lastOrder
//       ? parseInt(lastOrder.orderId.replace("CUT-ORID", ""))
//       : 0;
//     lastOrderId++;
//     return `CUT-ORID${String(lastOrderId).padStart(7, "0")}`;
//   };
//   exports.create = async (req, res) => {
//     try {
//       const orderId = await generateOrderId();
//       const {
//         totalAmount,
//         customerName,
//         deliveryDate,
//         email,
//         phone,
//         address,
//         paymentMethod,
//         paidAmount,
//         paymentStatus,
//         deliveryStatus,
//         orderDate,
//         note,
//         Pincode,
//         products,
//         customerId,
//       } = req.body;
  
//       if (!customerId) {
//         return res.status(400).json({ message: "Customer ID is required." });
//       }
  
//       // Create a new order
//       const newOrder = new CustomerOrder({
//         customerId,
//         orderId,
//         totalAmount,
//         customerName,
//         email,
//         phone,
//         address,
//         paymentMethod,
//         paidAmount,
//         balanceAmount: totalAmount - paidAmount,
//         paymentStatus,
//         deliveryStatus,
//         orderDate,
//         deliveryDate,
//         note,
//         Pincode,
//         products,
//       });
  
//       await newOrder.save();
//       return res.status(201).json({ message: "Order created successfully", order: newOrder });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: "Server error", error });
//     }
//   };
  

//   //get customer orders by customerId
//   exports.getOrderDetailsByCustomer = async (req, res) => {
//     try {
//       const customerId = req.params.customerId;
      
//       // Fetch the orders and populate the products
//       const orders = await CustomerOrder.find({ customerId })
//         .populate('products'); 
  
//       if (orders.length === 0) {
//         return res.status(404).json({ message: "No orders found for this customer" });
//       }
  
//       res.status(200).json({ orders });
//     } catch (error) {
//       res.status(500).json({ message: "Server error", error });
//     }
//   };



//   //get customerorder by id
//   exports.get = async (req, res) => {
//     try { 
//       const { id } = req.params;
//       const order = await CustomerOrder.findById(id);
//       res.status(200).json({ order });
//   }
//     catch (error) {
//       res.status(500).json({ message: "Server error", error });
//     }
//   };

// //delete customerorder by id
// exports.delete =async (req, res) => {
//   try {
//     const { id } = req.params;
//     const order = await CustomerOrder.findByIdAndDelete(id);
//     res.status(200).json({ message: "Order deleted successfully", order });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };








const OrderDetails = require("../models/order");
const CustomerCart = require("../models/customercart");
const Customer = require("../models/customer");
const ShippingAddress = require("../models/shippingtax");
const Product = require("../models/products");
//   //get all customer order
exports.getAll = async (req, res) => {
  try {
    const orders = await OrderDetails.find()
      .populate('customerId')
      .populate('shippingaddress')
      .populate({
        path: 'cartItem',
        model: 'CustomerCart',
        populate: {
          path: 'productId',
          model: 'Product',
        },
      });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerId,
      shippingaddress,
      cartItem,
      shippingFee,
      tax,
      isGiftWrapped,
      giftMessage,
      giftWrapFee,
      couponDiscount,
      customerNote,
      paymentMethod,
      paymentDetails,
      subtotal,
      totalAmount,
      paymentStatus
    } = req.body;

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(501).json({ message: "Customer not found" });
    }


    // Validate cart items exist and are for this customer
    const cartItems = await CustomerCart.find({
      _id: { $in: cartItem },
      customerId
    }).populate('productId');

    if (!cartItems || cartItems.length === 0) {
      return res.status(503).json({ message: "No valid cart items found" });
    }

    // Create the new order
    const newOrder = new OrderDetails({
      customerId,
      shippingaddress,
      cartItem,
      shippingFee: shippingFee || 0,
      tax,
      isGiftWrapped: isGiftWrapped || false,
      giftMessage,
      giftWrapFee: isGiftWrapped ? (giftWrapFee || 30) : 0,
      couponDiscount: couponDiscount || 0,
      customerNote,
      paymentMethod,
      paymentDetails,
      subtotal,
      totalAmount,
      paymentStatus: paymentStatus || "pending"
    });

    // Save the order
    const savedOrder = await newOrder.save();

    // Update product stock
    for (const item of cartItems) {
      const product = await Product.findById(item.productId._id);
      
      if (product) {
        // Update total stock
        if (product.totalStock !== undefined) {
          product.totalStock = Math.max(0, product.totalStock - item.quantity);
        }
        
        // Update size-specific stock if applicable
        if (item.selectedProductSize && product.sizes && product.sizes.length > 0) {
          const sizeIndex = product.sizes.findIndex(s => s.size === item.selectedProductSize);
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].stock = Math.max(0, product.sizes[sizeIndex].stock - item.quantity);
          }
        }
        
        await product.save();
      }
    }

    // Return the created order with populated data
    const populatedOrder = await OrderDetails.findById(savedOrder._id)
      .populate('customerId')
      .populate('shippingaddress')
      .populate({
        path: 'cartItem',
        populate: {
          path: 'productId',
          model: 'Product'
        }
      });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const order = await OrderDetails.findById(orderId)
      .populate('customerId')
      .populate('shippingaddress')
      .populate({
        path: 'cartItem',
        populate: {
          path: 'productId',
          model: 'Product'
        }
      });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message
    });
  }
};

// Get all orders for a customer
exports.getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    
    const orders = await OrderDetails.find({ customerId })
      .populate('shippingaddress')
      .populate({
        path: 'cartItem',
        populate: {
          path: 'productId',
          model: 'Product'
        }
      })
      .sort({ createdAt: -1 }); // Sort by newest first
    
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching customer orders",
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, note } = req.body;
    
    const order = await OrderDetails.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    // Update order status
    order.orderStatus = orderStatus;
    
    // Add to status history
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${orderStatus}`
    });
    
    // If status is "delivered", set actual delivery date
    if (orderStatus === "delivered") {
      order.actualDeliveryDate = new Date();
    }
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, transactionId, paidAmount } = req.body;
    
    const order = await OrderDetails.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    // Update payment information
    order.paymentStatus = paymentStatus;
    if (paidAmount) order.paidAmount = paidAmount;
    if (transactionId) order.paymentDetails.transactionId = transactionId;
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await OrderDetails.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    // Only allow cancellation if order is in pending or processing state
    if (!["pending", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in '${order.orderStatus}' status`
      });
    }
    
    // Update order status
    order.orderStatus = "cancelled";
    
    // Add to status history
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      note: reason || "Order cancelled by customer"
    });
    
    // Update payment status if necessary
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
      order.refundStatus = "processing";
      order.refundAmount = order.paidAmount;
    }
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    // Restore product stock
    const cartItems = await CustomerCart.find({
      _id: { $in: order.cartItem }
    }).populate('productId');
    
    for (const item of cartItems) {
      const product = await Product.findById(item.productId._id);
      
      if (product) {
        // Restore total stock
        if (product.totalStock !== undefined) {
          product.totalStock += item.quantity;
        }
        
        // Restore size-specific stock if applicable
        if (item.selectedProductSize && product.sizes && product.sizes.length > 0) {
          const sizeIndex = product.sizes.findIndex(s => s.size === item.selectedProductSize);
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].stock += item.quantity;
          }
        }
        
        await product.save();
      }
    }
    
    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message
    });
  }
};

// Clear cart after successful order
exports.clearCustomerCart = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { cartItemIds } = req.body;
    
    // Delete cart items
    if (cartItemIds && cartItemIds.length > 0) {
      await CustomerCart.deleteMany({
        _id: { $in: cartItemIds },
        customerId
      });
    } else {
      await CustomerCart.deleteMany({ customerId });
    }
    
    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message
    });
  }
};