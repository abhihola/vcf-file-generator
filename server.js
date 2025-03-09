const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const nodemailer = require('nodemailer');
const vcfGenerator = require('./vcf_generator');

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

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // Update for other providers
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send email with VCF file
const sendVCFEmail = async (to, vcfFilePath) => {
    try {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: 'Your Contact VCF File',
            text: 'Here is your VCF file. Thank you for using our service!',
            attachments: [{ path: vcfFilePath }]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Submit Contact Details & Schedule Email
app.post('/submit', async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const newContact = new Contact({ name, phone, email });
        await newContact.save();

        // Generate VCF & send email after 10 minutes
        setTimeout(async () => {
            const vcfFilePath = await vcfGenerator.generateVCF();
            await sendVCFEmail(email, vcfFilePath);
        }, 10 * 60 * 1000);

        res.status(200).json({ message: 'Contact saved successfully. You will receive your VCF file via email in 10 minutes.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve Home Page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve Test Page
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
