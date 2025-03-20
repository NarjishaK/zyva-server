
const Customer = require("../models/customer");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTPService = require('../services/otpService'); // Assume this service handles OTP generation and verification

//create customer
exports.create = asyncHandler(async (req, res) => {
    const { name, email, phone, address, password } = req.body;
    if (!name || !email || !phone || !address  ) {
        return res.status(400).json({ message: "Please add all fields" });
    }

    // Check  email or phone already exists
    const customerExists = await Customer.findOne({ 
        $or: [{ email: email }, { phone: phone }] 
    });

    if (customerExists) {
        if (customerExists.email === email) {
            return res.status(400).json({ message: "Email already exists" });
        }
        if (customerExists.phone === phone) {
            return res.status(400).json({ message: "Phone number already exists" });
        }
    }
    const customer = await Customer.create(req.body);
    res.status(200).json(customer);
})

//get all customers
exports.getAll = asyncHandler(async (req, res) => {
    const customers = await Customer.find();
    res.status(200).json(customers);
})


//get by Id
exports.get = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    res.status(200).json(customer);
})


//update customer
exports.update = asyncHandler(async (req, res) => {
    const { name, email, phone, address } = req.body;
    const { id } = req.params;
    // Check if email or phone is already being used by another customer
    const emailExists = await Customer.findOne({ email, _id: { $ne: id } });
    const phoneExists = await Customer.findOne({ phone, _id: { $ne: id } });

    if (emailExists) {
        return res.status(400).json({ message: "Email already in use by another customer" });
    }
    if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use by another customer" });
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    res.status(200).json(customer);
})


//delete customer
exports.delete = asyncHandler(async (req, res) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json(customer);
})


//delete all customers
exports.deleteAll = asyncHandler(async (req, res) => {
    const customers = await Customer.deleteMany();
    res.status(200).json(customers);
})


//get customer suggestions
exports.getCustomerSuggestions = async (req, res) => {
    try {
      const { query } = req.query;
      const customers = await Customer.find({ name: { $regex: query, $options: 'i' } })
        .select('name email phone address')
        .limit(5);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer suggestions", error });
    }
  };

  //login customer
  exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin = await Customer.findOne({ email: email });
      if (!admin) {
        console.log("No user found with email:", email);
        return res
          .status(400)
          .json({ invalid: true, message: "Invalid email or password" });
      }
      const isPasswordMatch = await bcrypt.compare(password, admin.password);
      if (isPasswordMatch) {
        console.log("Password matched for user:", email);
        const customerDetails = {
          name: admin.name,
          email: admin.email,
          _id: admin._id,
          phone: admin.phone,
          address: admin.address,
          password: password,
        };

        const token = jwt.sign(
          { email: admin.email, id: admin._id },
          "myjwtsecretkey",
          { expiresIn: "1h" }
        );
        admin.tokens = token;
        await admin.save();

        return res.status(200).json({ token, customerDetails });
      } else {
        console.log("Invalid password for user:", email);
        return res
          .status(400)
          .json({ invalid: true, message: "Invalid email or password" });
      }
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Server error, please try again" });
    }
  });


// Send OTP for password reset
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = OTPService.generateOTP();
    // Call the modified sendEmailOTP and pass email and otp
    const response = await OTPService.sendEmailOTP(email, otp);

    if (response.status !== 200) {
      return res.status(response.status).json({ message: response.message });
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP', error });
  }
};



// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValidOTP = OTPService.verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password = hashedPassword;
    await customer.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error });
  }
};
