const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', ContactSchema);
