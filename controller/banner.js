const asyncHandler = require("express-async-handler");
const Banner = require("../models/banner");


// Update banner
exports.update = asyncHandler(async (req, res) => {
  const updatedData = {
    title: req.body.title,
    description: req.body.description,
  };

  if (req.file) {
    updatedData.image = req.file.filename; 
  }

  const banner = await Banner.findByIdAndUpdate(req.params.id, updatedData, {
    new: true,
    runValidators: true, 
  });

  if (!banner) {
    return res.status(404).json({ message: "Banner not found" });
  }

  res.status(200).json(banner);
});
//create banner
exports.create = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const image = req.file.filename;

  if (!image) {
    return res.status(400).json({ message: "Please add all fields" });
  }

  const banner = await Banner.create({
    title,
    description,
    image,
  });
  res.status(200).json(banner);
});

//get all banners
exports.getAll = asyncHandler(async (req, res) => {
  const banners = await Banner.find();
  res.status(200).json(banners);
});

//get by Id
exports.get = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  res.status(200).json(banner);
});

//delete banner
exports.delete = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  res.status(200).json(banner);
});

//delete all banners
exports.deleteAll = asyncHandler(async (req, res) => {
  const banners = await Banner.deleteMany();
  res.status(200).json(banners);
});
