const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send an email with a VCF attachment
const sendEmailWithVCF = async (to) => {
    try {
        const vcfPath = path.join(__dirname, 'sample.vcf'); // Ensure a sample VCF file exists
        if (!fs.existsSync(vcfPath)) {
            console.error('VCF file not found!');
            return;
        }

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: 'Your VCF File',
            text: 'Attached is your generated VCF file.',
            attachments: [{ path: vcfPath }]
        };

        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Test route to send VCF via email
app.get('/test-vcf-email', async (req, res) => {
    try {
        const testRecipient = 'your-test-email@example.com'; // Change this to your real email
        await sendEmailWithVCF(testRecipient);
        res.send('Test VCF email sent successfully!');
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).send('Failed to send test email.');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
