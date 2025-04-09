const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  label: {
    type: String, // e.g., "Home", "Work"
  },
  addressLine: {
    type: String,
    required: true,
  },
  apartment: String,
  city: String,
  state: String,
  country: String,
  zipCode: String,
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: { // default address
    type: String,
  },
  addressBook: [addressSchema], // multiple addresses
  password: {
    type: String,
  },
  tokens: {
    type: String,
    default: "",
  },
});

// Hash the password before saving the customer, but only if the password is provided
customerSchema.pre("save", async function (next) {
  if (this.password && (this.isModified("password") || this.isNew)) {
    if (!this.password.startsWith("$2b$")) {
      try {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        next();
      } catch (err) {
        console.log(err.message, "Error occurred during password hashing.");
        return next(err);
      }
    } else {
      console.log("Password is already hashed.");
      return next();
    }
  } else {
    console.log("No password provided or password is not modified.");
    next();
  }
});

module.exports = mongoose.model("Customer", customerSchema);
