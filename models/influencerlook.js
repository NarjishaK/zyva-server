const mongoose = require("mongoose");

const influencerSchema = new mongoose.Schema({
  title: { type: String,  },
  image: { type: String, required: true },
});

module.exports = mongoose.model("InfluencerLook", influencerSchema);
