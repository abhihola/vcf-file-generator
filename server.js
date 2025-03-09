const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const path = require('path');

const vcfGenerator = require('./vcf_generator');
const emailService = require('./email_service');
const Contact = require('./models/contact');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Submit Contact Route
app.post('/submit', async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        if (!name || !phone || !email) {
            return res.status(400).json({ error: '⚠ All fields are required' });
        }

        const newContact = new Contact({ name, phone, email });
        await newContact.save();
        res.status(200).json({ message: '✅ Contact saved successfully' });
    } catch (err) {
        console.error('❌ Error saving contact:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Cron Job: Generate & Send VCF Every 3 Days
nodeCron.schedule('0 0 */3 * *', async () => {
    console.log('🔄 Running scheduled task: Generate VCF & Send Emails');
    
    try {
        const vcfPath = await vcfGenerator.generateVCF();
        await emailService.sendVCF(vcfPath);
        console.log('✅ VCF generated & emails sent successfully');
    } catch (error) {
        console.error('❌ Error in cron job:', error);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
