const CustomerOrder = require('../models/customerorder');

// Generate unique orderId starting with CUT-ORID000001 format
const generateOrderId = async () => {
    const lastOrder = await CustomerOrder.findOne().sort({ _id: -1 }).limit(1);
    let lastOrderId = lastOrder
      ? parseInt(lastOrder.orderId.replace("CUT-ORID", ""))
      : 0;
    lastOrderId++;
    return `CUT-ORID${String(lastOrderId).padStart(7, "0")}`;
  };
  exports.create = async (req, res) => {
    try {
      const orderId = await generateOrderId();
      const {
        totalAmount,
        customerName,
        deliveryDate,
        email,
        phone,
        address,
        paymentMethod,
        paidAmount,
        paymentStatus,
        deliveryStatus,
        orderDate,
        note,
        Pincode,
        products,
        customerId,
      } = req.body;
  
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required." });
      }
  
      // Create a new order
      const newOrder = new CustomerOrder({
        customerId,
        orderId,
        totalAmount,
        customerName,
        email,
        phone,
        address,
        paymentMethod,
        paidAmount,
        balanceAmount: totalAmount - paidAmount,
        paymentStatus,
        deliveryStatus,
        orderDate,
        deliveryDate,
        note,
        Pincode,
        products,
      });
  
      await newOrder.save();
      return res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error });
    }
  };
  

  //get customer orders by customerId
  exports.getOrderDetailsByCustomer = async (req, res) => {
    try {
      const customerId = req.params.customerId;
      
      // Fetch the orders and populate the products
      const orders = await CustomerOrder.find({ customerId })
        .populate('products'); 
  
      if (orders.length === 0) {
        return res.status(404).json({ message: "No orders found for this customer" });
      }
  
      res.status(200).json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

  //get all customer order
  exports.getAll = async (req, res) => {
    try {
      const orders = await CustomerOrder.find();
      res.status(200).json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

  //get customerorder by id
  exports.get = async (req, res) => {
    try { 
      const { id } = req.params;
      const order = await CustomerOrder.findById(id);
      res.status(200).json({ order });
  }
    catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

//delete customerorder by id
exports.delete =async (req, res) => {
  try {
    const { id } = req.params;
    const order = await CustomerOrder.findByIdAndDelete(id);
    res.status(200).json({ message: "Order deleted successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

