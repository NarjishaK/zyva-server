const asyncHandler = require("express-async-handler");
const Supplier = require("../models/supplier");

// Create supplier
exports.create = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;
    const existingSupplier = await Supplier.findOne({
        $or: [{ email }, { phone }]
    });
    if (existingSupplier) {
        return res.status(400).json({
            message: 'Supplier with this email or phone number already exists.'
        });
    }
    const supplier = await Supplier.create(req.body);
    res.status(200).json(supplier);
});

//get all suppliers
exports.getAll = asyncHandler(async (req, res) => {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
})

//get by Id
exports.get = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findById(req.params.id);
    res.status(200).json(supplier);
})

//update supplier
exports.update = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;
    const { id } = req.params;

    const existingSupplier = await Supplier.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: id } 
    });

    if (existingSupplier) {
        return res.status(400).json({
            message: 'A supplier with this email or phone number already exists.'
        });
    }

    const supplier = await Supplier.findByIdAndUpdate(id, req.body, {
        new: true
    });

    if (!supplier) {
        return res.status(404).json({
            message: 'Supplier not found.'
        });
    }

    res.status(200).json(supplier);
});


//delete supplier
exports.delete = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    res.status(200).json(supplier);
})

//delete all suppliers
exports.deleteAll = asyncHandler(async (req, res) => {
    const suppliers = await Supplier.deleteMany();
    res.status(200).json(suppliers);
})

//get suppliers suggestions
exports.getSupplierSuggestions = async (req, res) => {
    try {
      const { query } = req.query;
      const suppliers = await Supplier.find({ name: { $regex: query, $options: 'i' } })
        .select('name email phone address shop item')
        .limit(6);
  
      // Check if suppliers are found
      if (suppliers.length === 0) {
        return res.status(404).json({ message: "Supplier name not available" });
      }
  
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching supplier suggestions", error });
    }
  };
  