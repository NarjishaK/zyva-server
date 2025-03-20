const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    warehouse: {
        type: String,
        required: true
    },
    code: { type: String, unique: true, required: true }, // Ensure code is unique
  
});

module.exports = mongoose.model('Warehouse', warehouseSchema)
