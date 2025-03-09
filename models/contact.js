const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String
});

module.exports = mongoose.model("Contact", ContactSchema);
