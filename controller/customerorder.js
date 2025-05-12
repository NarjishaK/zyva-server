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










const OrderDetails = require("../models/order");
const CustomerCart = require("../models/customercart");
const Customer = require("../models/customer");
const Product = require("../models/products");

// //delete customerorder by id
exports.delete =async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderDetails.findByIdAndDelete(id);
    res.status(200).json({ message: "Order deleted successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
//   //get all customer order
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.orderStatus = status;
    }
    
    if (dateFrom || dateTo) {
      filter.orderDate = {};
      if (dateFrom) {
        filter.orderDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.orderDate.$lte = new Date(dateTo);
      }
    }
    
    // Count total matching documents
    const total = await OrderDetails.countDocuments(filter);
    
    // Get paginated orders
    const orders = await OrderDetails.find(filter).populate("items.productId")
      .sort({ createdAt: -1 })
    
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};


// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerId,
      items,
      shippingAddress,
      paymentMethod,
      customerNote,
      isGiftWrapped,
      giftMessage,
      couponCode,
      couponDiscount,
      vatAmount,
    } = req.body;

    // Validate required fields
    if (!customerId || !items || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get customer details
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Calculate order totals
    let subtotal = 0;
    let totalAmount = 0;
    const giftWrapFee = isGiftWrapped ? 30 : 0;

    // Validate products and get details
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        });
      }

      // Calculate item price
      const itemPrice = product.price * item.quantity;
      subtotal += itemPrice;

      // Add to order items
      orderItems.push({
        productId: product._id,
        name: product.name || product.mainCategory,
        price: product.price,
        quantity: item.quantity,
        selectedColor: item.selectedColor || item.selectedProductColor,
        selectedSize: item.selectedSize || item.selectedProductSize,
        image: product.images && product.images.length > 0 ? product.images[0] : ""
      });
    }

    // Calculate total amount
    totalAmount = subtotal + (vatAmount || 0) + giftWrapFee - (couponDiscount || 0);

    // Create new order
    const order = new OrderDetails({
      customerId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      items: orderItems,
      shippingAddress,
      subtotal,
      vatAmount: vatAmount || 0,
      isGiftWrapped,
      giftMessage,
      giftWrapFee,
      couponCode,
      couponDiscount: couponDiscount || 0,
      customerNote,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "pending", // Set based on payment method
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Order placed",
        },
      ],
    });

    // Save order
    await order.save();

    // Clear customer's cart after successful order
    await CustomerCart.deleteMany({ customerId });

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};


// Get order by ID
exports.getOrderById = async (req, res) => {
  try {

    const order = await OrderDetails.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("items.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Get all orders for a customer
exports.getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;

    const orders = await OrderDetails.find({ customerId }).populate("items.productId")
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer orders",
      error: error.message,
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
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;
    
    // Add to status history
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${orderStatus}`,
    });

    // If order is delivered, set actual delivery date
    if (orderStatus === "delivered") {
      order.actualDeliveryDate = new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
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
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = paymentStatus;
    
    if (transactionId) {
      order.paymentDetails.transactionId = transactionId;
    }
    
    if (paidAmount) {
      order.paidAmount = paidAmount;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};

// Request order return
exports.requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { returnReason, returnItems } = req.body;

    const order = await OrderDetails.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order is eligible for return
    if (!order.isReturnEligible()) {
      return res.status(400).json({
        success: false,
        message: "Order is not eligible for return",
      });
    }

    // Update order return info
    order.returnRequested = true;
    order.returnReason = returnReason;
    order.returnStatus = "requested";
    
    // Calculate potential refund amount
    const potentialRefundAmount = order.calculateRefundAmount(returnItems);
    order.refundAmount = potentialRefundAmount;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      returnStatus: order.returnStatus,
      potentialRefundAmount,
    });
  } catch (error) {
    console.error("Error requesting return:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit return request",
      error: error.message,
    });
  }
};

// Cancel order
 exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;

    const order = await OrderProduct.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order can be cancelled (only pending or processing orders)
    if (!["pending", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
      });
    }

    // Update order status
    order.orderStatus = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      note: cancellationReason || "Order cancelled by customer",
    });

    // If payment was made, update payment status to refunded
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
      order.refundAmount = order.totalAmount;
      order.refundStatus = "completed";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
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


//bestselling products
exports.bestselling = async (req, res) => {
  try {
    const orders = await OrderDetails.find()
      .populate("items.productId")
      .sort({ salesCount: -1 });

    // Extract all product documents and flatten
    const allProducts = orders.flatMap(order =>
      order.items
        .map(item => item.productId)
        .filter(product => product) // remove nulls
    );

    // Deduplicate by product._id
    const uniqueProductsMap = new Map();
    for (const product of allProducts) {
      if (!uniqueProductsMap.has(product._id.toString())) {
        uniqueProductsMap.set(product._id.toString(), product);
      }
      if (uniqueProductsMap.size === 8) break; // stop after 8 unique
    }

    const bestsellingProducts = Array.from(uniqueProductsMap.values());

    res.json(bestsellingProducts);
  } catch (error) {
    console.error("Error fetching bestselling products:", error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};
