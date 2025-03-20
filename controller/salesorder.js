const mongoose = require("mongoose");
const Order = require("../models/salesOrder");
const Product = require("../models/products");
const path = require("path");
require("dotenv").config();
const nodemailer = require("nodemailer");
const multer = require("multer");

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Increase to 50MB 
}).single("pdf");

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

exports.sendEmail = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File is too large. Max size is 25MB." }); // Updated limit
      }
      return res
        .status(400)
        .json({ message: "Error uploading file", error: err.message });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "Unknown error", error: err.message });
    }

    const { Email, adminName } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    if (!Email) {
      return res.status(400).json({ message: "Customer email is required!" });
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL,
        to: Email,
        subject: "Your Invoice",
        text: `Dear Customer, please find attached the invoice for your purchase.`,
        attachments: [
          {
            filename: `invoice-${req.body.customerName || "customer"}.pdf`,
            content: req.file.buffer,
            contentType: "application/pdf",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
      console.error("Error sending email:", error);
      res
        .status(500)
        .json({ message: "Failed to send email", error: error.message });
    }
  });
};

// generate order id
const generateOrderId = async () => {
  const lastOrder = await Order.findOne().sort({ _id: -1 }).limit(1);
  let lastOrderId = lastOrder
    ? parseInt(lastOrder.orderId.replace("ORDID", ""))
    : 0;
  lastOrderId++;
  return `ORDID${String(lastOrderId).padStart(7, "0")}`;
};

exports.createOrder = async (req, res) => {
  try {
    const orderId = await generateOrderId();
    const {
      adminName,
      totalAmount,
      customerName,
      deliveryDate,
      email,
      phone,
      address,
      orderStatus,
      paymentMethod,
      paidAmount,
      paymentStatus,
      deliveryStatus,
      orderDate,
      note,
      products,
    } = req.body;

    // Create a new order
    const newOrder = new Order({
      orderId,
      totalAmount,
      customerName,
      email,
      phone,
      address,
      adminName,
      orderStatus,
      paymentMethod,
      paidAmount,
      balanceAmount: totalAmount - paidAmount,
      paymentStatus,
      deliveryStatus,
      orderDate,
      deliveryDate,
      note,
      products,
    });

    // Save the order to the database
    await newOrder.save();
    res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

//get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//get  by id
exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//delete order
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    res.status(200).json({ message: "Order deleted successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

