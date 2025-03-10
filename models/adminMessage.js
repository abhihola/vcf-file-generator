const mongoose = require("mongoose");

const AdminMessageSchema = new mongoose.Schema({
  message: { type: String, required: true },
});

module.exports = mongoose.model("AdminMessage", AdminMessageSchema);
