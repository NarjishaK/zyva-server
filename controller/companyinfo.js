const About = require("../models/comapnyinfo");

// Create about details
exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      vision,
      mission,
      goal,
    } = req.body;

    // Check if all required fields are present
    if (!title || !description || !vision || !mission || !goal) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Extract file paths for uploaded images
    const visionimage = req.files?.visionimage?.[0]?.filename;
    const missionimage = req.files?.missionimage?.[0]?.filename;
    const goalimage = req.files?.goalimage?.[0]?.filename;
    if (!visionimage || !missionimage || !goalimage) {
      return res.status(400).json({ message: "All images are required" });
    }

    // Create a new About entry
    const newAbout = new About({
      title,
      description,
      visionimage,
      vision,
      missionimage,
      mission,
      goalimage,
      goal,
    });

    // Save to database
    const savedAbout = await newAbout.save();

    res.status(201).json({
      message: "About details created successfully",
      about: savedAbout,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating about details", error });
  }
};

// Get all about details
exports.getAll = async (req, res) => {
  try {
    const about = await About.find();
    res.status(200).json(about);
  } catch (error) {
    res.status(500).json({ message: "Error fetching about details", error });
  }
};
// Get about details by ID
exports.get = async (req, res) => {
  try {
    const about = await About.findById(req.params.id);
    res.status(200).json(about);
  } catch (error) {
    res.status(500).json({ message: "Error fetching about details", error });
  }
}
// Update about details
exports.update = async (req, res) => {
  try {
    const {
      title,
      description,
      vision,
      mission,
      goal,
    } = req.body;

    // Check if all required fields are present
    if (!title || !description || !vision || !mission || !goal) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Extract file paths for uploaded images
    const visionimage = req.files?.visionimage?.[0]?.filename;
    const missionimage = req.files?.missionimage?.[0]?.filename;
    const goalimage = req.files?.goalimage?.[0]?.filename;
    if (!visionimage || !missionimage || !goalimage) {
      return res.status(400).json({ message: "All images are required" });
    }

    const updatedAbout = await About.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        visionimage,
        vision,
        missionimage,
        mission,
        goalimage,
        goal,
      },
      { new: true }
    );

    res.status(200).json({
      message: "About details updated successfully",
      about: updatedAbout,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating about details", error });
  }
};

// Delete about details
exports.delete = async (req, res) => {
  try {
    await About.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "About details deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting about details", error });
  }
};