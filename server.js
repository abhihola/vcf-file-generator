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

// Contact Model
const Contact = require('./models/contact');

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send VCF via email
const sendEmail = async (to, attachmentPath) => {
    try {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: 'Your WhatsApp VCF File',
            text: `Thanks for using our service! This is the fastest way to gain WhatsApp contacts and boost your status views. 🚀 

Support us by sharing the website link with others: 🔗 https://vcf-file-generator.onrender.com/ 

Keep growing your network! 😊`,
            attachments: [{ path: attachmentPath }]
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}:`, info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Route to submit contact details
app.post('/submit', async (req, res) => {
    try {
        let { name, phone, email, countryCode } = req.body;
        
        // Ensure the phone number doesn't already exist
        const existingContact = await Contact.findOne({ phone });
        if (existingContact) {
            return res.status(400).json({ error: 'This WhatsApp number is already registered.' });
        }

        // Format phone number
        phone = phone.startsWith('+') ? phone : `+${countryCode}${phone}`;

        const newContact = new Contact({ name, phone, email });
        await newContact.save();

        // Generate VCF and send email after 1 minute
        setTimeout(async () => {
            const vcfPath = await vcfGenerator.generateVCF();
            await sendEmail(email, vcfPath);
        }, 60000); // 1 minute delay

        res.status(200).json({ message: 'Contact saved successfully. Your VCF file will be sent to your email soon.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the Homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the Test Page
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Send updated VCF to all users every midnight
nodeCron.schedule('0 0 * * *', async () => {
    console.log('Regenerating VCF file for all users...');
    const vcfPath = await vcfGenerator.generateVCF();

    const allUsers = await Contact.find({});
    for (const user of allUsers) {
        await sendEmail(user.email, vcfPath);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
