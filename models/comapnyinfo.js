const mongoose = require("mongoose");

const aboutCompany = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    visionimage: {
        type: String,
        required: true
    },
    vision:{
        type: String,
        required: true
    },
    missionimage: {
        type: String,
        required: true
    },
    mission: {
        type: String,
        required: true
    },
    goalimage: {
        type: String,
        required: true
    },
    goal: {
        type: String,
        required: true
    },
    history:{
        type: String,
    },
    historyimage: {
        type: String,
    },
    founderimage: {
        type: String,
    },
    founder: {
        type: String,
        required: true
    },
    brand: {
        type: String,
    },
    brandimage: {
        type: [String],
    },
});

module.exports = mongoose.model("About", aboutCompany);
