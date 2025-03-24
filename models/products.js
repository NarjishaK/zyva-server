const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    
      mainCategory: { type: String, required: true },
      coverimage: { type: String, required: true },
      subCategory: { type: String, required: true },
      price: { type: Number, required: true },
      productId: { type: String, required: true , unique: true,},
      modelNo: { type: String, required: true },
      // date: { type: Date },
      totalStock: { type: Number},
      returnpolicy: { type: String,  },
      // warehouse: { type: String },
      tag:{ type: String },
      title: { type: String, required: true },
      description: { type: String },
      images: { type: [String], required: true }, 
      color: { type: String, required: true },
      createAt: { type: Date, default: Date.now },
      sizes: [
        {
          size: { type: String, required: true },
          stock: { type: Number, default: 0 },
          selected: { type: Boolean, default: false },
        },
      ],
    }, 
    { timestamps: true });

module.exports = mongoose.model("Product", productSchema)
