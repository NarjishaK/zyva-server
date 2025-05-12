
const Customer = require("../models/customer");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const otpStore = new Map(); // In-memory store, use Redis or DB for production
require('dotenv').config(); 
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  const customer = await Customer.findOne({ email });

  if (!customer) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  await transporter.sendMail({
    from: "your_email@gmail.com",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`,
  });

  res.json({ message: "OTP sent" });
};

// 2. VERIFY OTP
exports.verifyOTP = (req, res) => {
  const { email, otp } = req.body;
  const validOtp = otpStore.get(email);

  if (!validOtp || validOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  otpStore.set(email, "VERIFIED"); // Mark as verified
  res.json({ message: "OTP verified" });
};

// 3. RESET PASSWORD
exports.resetPasswords = async (req, res) => {
  const { email, password } = req.body;
  const verified = otpStore.get(email);

  if (verified !== "VERIFIED") {
    return res.status(403).json({ message: "OTP not verified" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await Customer.findOneAndUpdate({ email }, { password: hashedPassword });

  otpStore.delete(email);
  res.json({ message: "Password reset successful" });
};
//create customer
exports.create = asyncHandler(async (req, res) => {
    const { name, email, phone, address, password } = req.body;
    if (!name || !email || !phone  ) {
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


//change password
exports.changePassword = async (req, res) => {
    const { customerId } = req.params;
    const { newPassword } = req.body;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'customer not found' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        customer.password = hashedPassword;
        await customer.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error while updating password' });
    }
};
//create addressbook customerby id
exports.createAddressBook = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.addressBook.push(req.body);
    await customer.save();

    res.status(201).json({ message: "Address added successfully", addressBook: customer.addressBook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get addressbook customerby id
exports.getAddressBook = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.json(customer.addressBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete addressbook customerby id
exports.deleteAddressBook =async (req, res) => {
  try {
    const { customerId, addressId } = req.params;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const address = customer.addressBook.id(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // Proper way to remove subdocument
    customer.addressBook.pull(addressId);
    await customer.save();

    res.json({ message: "Address deleted", addressBook: customer.addressBook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
    //update addressbook customerby id
    exports.updateAddressBook = async (req, res) => {
      try {
        const { customerId, addressId } = req.params;
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: "Customer not found" });
    
        const address = customer.addressBook.id(addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });
    
        Object.assign(address, req.body);
        await customer.save();
    
        res.json({ message: "Address updated", address });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    };




    // 1. SEND OTP
