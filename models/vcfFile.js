const mongoose = require("mongoose");

const VCFFileSchema = new mongoose.Schema({
    content: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("VCFFile", VCFFileSchema);
