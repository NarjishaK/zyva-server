const asyncHandler = require("express-async-handler");
const Influencer = require("../models/influencerlook");
const s3Client = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Delete object from S3
const deleteFromS3 = async (fileKeyOrUrl) => {
  const bucketName = process.env.S3_BUCKET_NAME;

  // Extract the filename if a URL is passed
  let fileKey = fileKeyOrUrl;
  if (fileKeyOrUrl.startsWith("http")) {
    const urlParts = new URL(fileKeyOrUrl);
    fileKey = decodeURIComponent(urlParts.pathname.replace(`/${bucketName}/`, "").replace(/^\//, ""));
  }

  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }));
    console.log(`✅ Deleted ${fileKey} from S3`);
  } catch (error) {
    console.error(`❌ Failed to delete ${fileKey} from S3:`, error.message);
  }
};

//craete influencerimage using aws s3 i mentioned that in route page
exports.create = asyncHandler(async (req, res) => {
  try {
    const image = req.files["image"] ? req.files["image"][0].location : null;

    const influencerData = {
      image: image,
      title: req.body.title,
    };

    const requiredFields = ["image", "title"];

    for (const field of requiredFields) {
      if (!influencerData[field]) {
        return res.status(400).json({
          success: false,
          error: `Field '${field}' is required.`,
        });
      }
    }

    const influencer = await Influencer.create(influencerData);
    res.status(201).json({
      success: true,
      data: influencer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


//delete influencer
exports.delete = asyncHandler(async (req, res) => {
  try {
    const influencer = await Influencer.findById(req.params.id);
    
    if (!influencer) {
      return res.status(404).json({ message: "influencer not found" });
    }

    // Delete associated S3 files (image,)
    if (influencer.image) await deleteFromS3(influencer.image);  
    // Delete the product
    await Influencer.findByIdAndDelete(influencer._id);


    res.status(200).json({ message: "influencer deleted successfully" });
  } catch (error) {
    console.error("Error deleting influencer:", error);
    res.status(500).json({ message: "Failed to delete influencer" });
  }
});

//get all influencers
exports.getAll = asyncHandler(async (req, res) => {
  const influencers = await Influencer.find();
  res.status(200).json(influencers);
});

//get by Id
exports.get = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findById(req.params.id);
  res.status(200).json(influencer);
});