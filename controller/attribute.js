const asyncHandler = require("express-async-handler");
const Attribute = require("../models/attribute");

// Add a new attribute (color, size, or brand)
exports.create = async (req, res) => {
    const { type, value } = req.body;
 
    if (!type || !value) {
      return res.status(400).json({ message: 'Type and value are required' });
    }
  
    try {
      const newAttribute = new Attribute({ type, value });
      await newAttribute.save();
      res.status(201).json(newAttribute);
    } catch (error) {
      res.status(500).json({ message: 'Error adding attribute', error });
    }
  };

 // Get all attributes by type (color, size, or brand)
exports.get = async (req, res) => {
    const { type } = req.params;
  
    try {
      const attributes = await Attribute.find({ type });
      res.status(200).json(attributes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching attributes', error });
    }
  };


// get all colors
exports.getColorAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find({ type: "color" }); 
    res.status(200).json(attributes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching colors', error });
  }
};

//get all sizes
exports.getSizeAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find({ type: "size" }); 
    res.status(200).json(attributes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sizes', error });
  }
};
//get all tags
exports.getTagAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find({ type: "tag" }); 
    res.status(200).json(attributes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tags', error });
  }
};
//delete color
exports.delete = async  (req, res) => {
    const { id } = req.params;
    
    try {
      await Attribute.findByIdAndDelete(id); 
      res.status(200).json({ message: 'Color deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting color', error });
    }
  };
  //delete size
exports.deleteSize =async (req, res) => {
    const { id } = req.params;
    
    try {
      await Attribute.findByIdAndDelete(id); 
      res.status(200).json({ message: 'Size deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting size', error });
    }
  };

  //delete tag
  exports.deleteTag =async (req, res) => {
    const { id } = req.params;
    
    try {
      await Attribute.findByIdAndDelete(id); 
      res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting tag', error });
    }
  };