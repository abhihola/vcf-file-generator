const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const vcfGenerator = require('./vcf_generator');
const nodemailer = require('nodemailer');

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
        const newContact = new Contact({ name, phone, email });
        await newContact.save();
        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the submission form (default homepage)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the test email site at /home
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/test.html');
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test Email Route
app.get('/test-email', async (req, res) => {
    try {
        const testRecipient = 'your-test-email@example.com'; // Change to your email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: testRecipient,
            subject: 'Test VCF',
            text: 'This is a test email.'
        });
        res.send('Test email sent successfully!');
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).send('Failed to send test email.');
    }
});

// Schedule VCF generation every 3 days
nodeCron.schedule('0 0 */3 * *', async () => {
    console.log('Generating VCF file...');
    await vcfGenerator.generateVCF();
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
