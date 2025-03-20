const mongoose = require("mongoose");

const AttributeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true, 
      },
      value: {
        type: String,
        required: true, 
      },
    }, { timestamps: true });

module.exports = mongoose.model("Attribute", AttributeSchema)