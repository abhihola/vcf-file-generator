const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const vcfGenerator = require('./vcf_generator');
const emailService = require('./email_service');
const authMiddleware = require('./middleware/auth');

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

// Models
const Contact = require('./models/contact');

// Route to submit contact details
app.post('/submit', async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        // Check if contact already exists
        const existingContact = await Contact.findOne({ phone });
        if (existingContact) {
            return res.status(400).json({ error: 'This contact already exists' });
        }

        const newContact = new Contact({ name, phone, email });
        await newContact.save();

        // Generate and send VCF file to the new user in 1 minute
        setTimeout(async () => {
            await vcfGenerator.generateVCF();
            await emailService.sendVCF(email);
        }, 60000);

        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the Home Page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the VCF download page
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Serve the Admin Page (Protected)
app.get('/admin', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// Scheduled task: Send updated VCF to all users every day at midnight
nodeCron.schedule('0 0 * * *', async () => {
    console.log('Regenerating VCF file and sending to all users...');
    await vcfGenerator.generateVCF();
    await emailService.sendVCFToAllUsers();
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
