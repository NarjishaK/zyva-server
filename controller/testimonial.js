const Testimonial = require("../models/testimonial");
const asyncHandler = require("express-async-handler");

//create testimonial
exports.create = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.create(req.body);
    res.status(200).json(testimonial);
});

//get all testimonials
exports.getAll = asyncHandler(async (req, res) => {
    const testimonials = await Testimonial.find();
    res.status(200).json(testimonials);
});

//delete testimonial
exports.delete = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    res.status(200).json(testimonial);
});