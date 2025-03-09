const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const nodeCron = require('node-cron');
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

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send email with VCF attachment
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
        console.error('Error sending email:', error);
    }
};

// Route to submit contact details
app.post('/submit', async (req, res) => {
    try {
        const { name, phone, email, country } = req.body;
        const newContact = new Contact({ name, phone, email, country });
        await newContact.save();

        // Schedule first VCF email after 10 minutes
        setTimeout(async () => {
            await vcfGenerator.generateVCF();
            await sendEmail(email, 'Your First VCF File', 'Here is your VCF file.', 'contacts.vcf');
        }, 10 * 60 * 1000);

        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the Homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the Home Page with VCF Download
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Schedule daily VCF updates
nodeCron.schedule('0 0 * * *', async () => {
    console.log('Generating daily VCF file and sending emails...');
    await vcfGenerator.generateVCF();

    const users = await Contact.find();
    for (const user of users) {
        await sendEmail(user.email, 'Daily Updated VCF', 'Here is your updated VCF file.', 'contacts.vcf');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
