const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const vcfGenerator = require('./vcf_generator');
const emailService = require('./email_service');

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

// Route to submit contact details
app.post('/submit', async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        // Check if the phone number already exists
        const existingContact = await Contact.findOne({ phone });
        if (existingContact) {
            return res.status(400).json({ error: 'Phone number already exists in the database' });
        }

        const newContact = new Contact({ name, phone, email });
        await newContact.save();

        console.log('New contact saved. Regenerating VCF file...');
        await vcfGenerator.generateVCF(); // Regenerate VCF file immediately

        // Schedule the first VCF file email to the new user (10 minutes delay)
        setTimeout(async () => {
            console.log(`Sending first VCF file to ${email}...`);
            await emailService.sendVCF(email);
        }, 10 * 60 * 1000); // 10 minutes delay

        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the Home Page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the Test Page
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Schedule VCF generation & email sending **EVERY DAY at Midnight**
nodeCron.schedule('0 0 * * *', async () => {
    console.log('Generating daily VCF file and sending emails to all users...');
    await vcfGenerator.generateVCF();

    const contacts = await Contact.find();
    for (const contact of contacts) {
        await emailService.sendVCF(contact.email);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
