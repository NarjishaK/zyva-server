const OTPStore = {}; // You can replace this with a database store for OTP persistence
const nodemailer = require('nodemailer');
const Customer = require('../models/customer');
require('dotenv').config(); 

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

exports.sendEmailOTP = async (email, otp) => {
  try {
    const admin = await Customer.findOne({ email });
    if (!admin) {
      return { status: 400, message: 'User with this email does not exist.' };
    }

    // Configure Nodemailer
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD          
      }
    });

    // Email options
    let mailOptions = {
      from: 'narjishakuniyil@gmail.com',
      to: admin.email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP is ${otp}.`
    };

    // Send email
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);

    // Store OTP
    OTPStore[email] = otp;

    return { status: 200, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP email: ', error);
    return { status: 500, message: 'Error sending OTP' };
  }
};


exports.verifyOTP = (email, otp) => {
  return OTPStore[email] === otp; 
};
