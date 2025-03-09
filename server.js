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
        let { name, phone, email, countryCode } = req.body;

        // Ensure phone number does not already exist
        const existingContact = await Contact.findOne({ phone });
        if (existingContact) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        // Remove country code if user enters it again
        if (phone.startsWith(countryCode)) {
            phone = phone.replace(countryCode, '');
        }

        const fullPhoneNumber = countryCode + phone;
        const newContact = new Contact({ name, phone: fullPhoneNumber, email });

        await newContact.save();

        // Generate and send VCF after 1 minute
        setTimeout(async () => {
            await vcfGenerator.generateVCF();
            await emailService.sendVCF(email);
        }, 60000); // 1 minute delay

        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the Home Page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Schedule daily VCF generation at midnight
nodeCron.schedule('0 0 * * *', async () => {
    console.log('Generating daily VCF file and sending to all users...');
    await vcfGenerator.generateVCF();
    await emailService.sendToAllUsers();
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
