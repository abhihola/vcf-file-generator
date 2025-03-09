const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const nodeCron = require('node-cron');

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
    service: 'gmail', // Change if using another provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send an email
const sendEmail = async (to, subject, text, attachmentPath) => {
    try {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        };

        if (attachmentPath) {
            mailOptions.attachments = [{ path: attachmentPath }];
        }

        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Test Email Route
app.get('/test-email', async (req, res) => {
    try {
        const testRecipient = 'your-test-email@example.com'; // Change to your email
        await sendEmail(testRecipient, 'Test VCF', 'This is a test email.', null);
        res.send('Test email sent successfully!');
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).send('Failed to send test email.');
    }
});

// Sample Route
app.get('/', (req, res) => {
    res.send('VCF Generator API is running.');
});

// Scheduled Job (Runs Every 3 Days)
nodeCron.schedule('0 0 */3 * *', () => {
    console.log('Running scheduled task: Generate VCF files and send emails.');
    // Call your VCF generation and email functions here
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
