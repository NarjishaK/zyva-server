const asyncHandler = require("express-async-handler");
const SubCategory = require("../models/subcategory");

//create subcategory
exports.create = asyncHandler(async (req, res) => {
    const subcategory = await SubCategory.create(req.body);
    res.status(200).json(subcategory);
})

//get all subcategories
exports.getAll = asyncHandler(async (req, res) => {
    const subcategories = await SubCategory.find().populate('category'); 
    res.status(200).json(subcategories);
});


//get by Id
exports.get = asyncHandler(async (req, res) => {
    const subcategory = await SubCategory.findById(req.params.id);
    res.status(200).json(subcategory);
})

//update subcategory
exports.update = asyncHandler(async (req, res) => {
    const subcategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    res.status(200).json(subcategory);
})

//delete subcategory
exports.delete = asyncHandler(async (req, res) => {
    const subcategory = await SubCategory.findByIdAndDelete(req.params.id);
    res.status(200).json(subcategory);
})

