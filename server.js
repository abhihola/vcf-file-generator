const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const vcfGenerator = require('./vcf_generator');
const emailService = require('./email_service');
const authMiddleware = require('./authMiddleware');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define Contact Model
const Contact = require('./models/contact');

// Contact submission route
app.post('/submit', async (req, res) => {
    try {
        let { name, phone, email } = req.body;

        // Ensure phone number doesn't already exist
        const existingContact = await Contact.findOne({ phone });
        if (existingContact) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        // Save new contact
        const newContact = new Contact({ name, phone, email });
        await newContact.save();

        // Schedule VCF file generation and email after 1 minute
        setTimeout(async () => {
            await vcfGenerator.generateVCF();
            await emailService.sendVCFEmail(email);
        }, 60000);

        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Panel Routes (Protected)
app.get('/admin', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the home page for VCF downloads
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Daily VCF file update
nodeCron.schedule('0 0 * * *', async () => {
    console.log('Generating new VCF file for all users...');
    await vcfGenerator.generateVCF();
    await emailService.sendVCFToAll();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
