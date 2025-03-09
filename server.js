const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const nodeCron = require('node-cron');
const path = require('path');

const Contact = require('./models/contact'); // Import Contact model
const { generateVCF } = require('./vcf_generator'); // VCF generation function
const { sendVCFEmail } = require('./email_service'); // Email sending function

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

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route to submit contacts
app.post('/api/submit', async (req, res) => {
    try {
        const { name, whatsapp, email } = req.body;

        // Validate input
        if (!name || !whatsapp || !email) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Save contact to MongoDB
        const newContact = new Contact({ name, whatsapp, email });
        await newContact.save();

        res.status(201).json({ message: 'Contact saved successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Cron job to generate and send VCF file every 3 days
nodeCron.schedule('0 0 */3 * *', async () => {
    try {
        console.log('Running scheduled task: Generating VCF file and sending emails.');

        // Generate VCF file
        const vcfFilePath = await generateVCF();

        // Send emails to users
        await sendVCFEmail(vcfFilePath);

        console.log('VCF file generated and emails sent.');
    } catch (error) {
        console.error('Error in scheduled task:', error);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
