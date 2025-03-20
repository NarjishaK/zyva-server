const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
    subcategory: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainCategory',
        required: true
    }
});

module.exports = mongoose.model('SubCategory', subcategorySchema)