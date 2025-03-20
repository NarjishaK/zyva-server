const asyncHandler = require("express-async-handler");
const Warehouse = require("../models/warehouse");


//create warehouse
exports.create = async (req, res) => {
    try {
      const { name, email, warehouse, phone, address, date } = req.body;
  
      // Generate a unique warehouse code
      const code = await generateWarehouseCode();
  
      const newWarehouse = new Warehouse({
        name,
        email,
        warehouse,
        phone,
        address,
        code,
        date,
      });
  
      await newWarehouse.save();
      res.status(201).json({ message: 'Warehouse created successfully', warehouse: newWarehouse });
    } catch (error) {
      console.error('Error creating warehouse:', error);
      res.status(500).json({ message: 'Error creating warehouse' });
    }
  };

//get all warehouses
exports.getAll = asyncHandler(async (req, res) => {
    const warehouses = await Warehouse.find();
    res.status(200).json(warehouses);
})

//get by Id
exports.get = asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findById(req.params.id);
    res.status(200).json(warehouse);
})

//update warehouse
exports.update = asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    res.status(200).json(warehouse);
})

//delete warehouse
exports.delete = asyncHandler(async (req, res) => {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    res.status(200).json(warehouse);
})

//delete all warehouses
exports.deleteAll = asyncHandler(async (req, res) => {
    const warehouses = await Warehouse.deleteMany();
    res.status(200).json(warehouses);
})

const generateWarehouseCode = async () => {
    const lastWarehouse = await Warehouse.findOne().sort({ createdAt: -1 });
  
    let nextCode = "WH0001"; 
    if (lastWarehouse) {
      const lastCodeNumber = parseInt(lastWarehouse.code.substring(2), 10);
      nextCode = `WH${String(lastCodeNumber + 1).padStart(4, "0")}`;
    }
    return nextCode;
  };