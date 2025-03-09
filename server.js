const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const vcfGenerator = require('./vcf_generator');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define Contact Model
const Contact = require('./models/contact');

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to Send Email
const sendEmail = async (to, subject, text, attachmentPath) => {
    try {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        if (attachmentPath) {
            mailOptions.attachments = [{ path: attachmentPath }];
        }

        let info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}:`, info.response);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};

// Handle Contact Submission
app.post('/submit', async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const newContact = new Contact({ name, phone, email });
        await newContact.save();

        // Schedule email after 10 minutes
        setTimeout(async () => {
            const vcfFilePath = await vcfGenerator.generateVCF();
            await sendEmail(email, 'Your Contact VCF File', 'Here is your VCF file.', vcfFilePath);
        }, 10 * 60 * 1000); // 10 minutes

        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Send Updated VCF File Daily to All Users
nodeCron.schedule('0 0 * * *', async () => {
    console.log('Generating daily VCF file and sending to all users...');

    const vcfFilePath = await vcfGenerator.generateVCF();
    const allContacts = await Contact.find();

    for (const contact of allContacts) {
        await sendEmail(contact.email, 'Daily Updated VCF File', 'Here is your daily updated VCF file.', vcfFilePath);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
