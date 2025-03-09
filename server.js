const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const nodemailer = require('nodemailer');
const path = require('path');
const vcfGenerator = require('./vcf_generator');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files

// MongoDB Connection
mongoose.set('strictQuery', false);
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

// Function to send emails with VCF attachment
const sendEmail = async (to, subject, text, attachmentPath) => {
    try {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            attachments: attachmentPath ? [{ path: attachmentPath }] : []
        };

        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

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

// Route to serve the main submission page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to serve the home page where VCF files can be downloaded
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Route to download the generated VCF file
app.get('/download', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'contacts.vcf');
    res.download(filePath, 'contacts.vcf', (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error downloading the file.');
        }
    });
});

// Schedule VCF generation & email sending every 3 days
nodeCron.schedule('0 0 */3 * *', async () => {
    console.log('Generating VCF file and sending emails...');
    const vcfPath = await vcfGenerator.generateVCF();
    
    // Fetch all contacts and send emails
    const contacts = await Contact.find();
    contacts.forEach(contact => {
        sendEmail(contact.email, 'Your VCF File', 'Here is your VCF file.', vcfPath);
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
