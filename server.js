const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const vcfGenerator = require('./vcf_generator');
const emailService = require('./email_service');

// Load environment variables
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
    .catch(err => console.error('MongoDB connection error:', err));

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
            try {
                await vcfGenerator.generateVCF([newContact]); // Generate VCF for the new contact
                await emailService.sendVCF(email); // Send VCF to the user's email
                console.log(`VCF sent successfully to ${email}`);
            } catch (err) {
                console.error('Error generating or sending VCF:', err.message);
            }
        }, 60000); // 1 minute delay

        res.status(200).json({ message: 'Contact saved successfully' });
    } catch (err) {
        console.error('Error saving contact:', err.message);
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

// Helper function to send emails in batches
async function sendEmailsInBatches(emails, batchSize) {
    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        console.log(`Sending batch of ${batch.length} emails...`);
        try {
            await emailService.sendToBatch(batch); // Send emails to this batch
            console.log(`Batch of ${batch.length} emails sent successfully.`);
        } catch (err) {
            console.error('Error sending email batch:', err.message);
        }
    }
}

// Schedule daily VCF generation and email sending at 9:15 AM Nigeria time (8:15 AM UTC)
nodeCron.schedule('15 8 * * *', async () => {
    try {
        console.log('Generating daily VCF file and sending to all users...');

        // Step 1: Fetch all contacts from the database
        const contacts = await Contact.find({});
        if (!contacts || contacts.length === 0) {
            console.log('No contacts found in the database.');
            return;
        }

        // Step 2: Generate VCF file with all contacts
        await vcfGenerator.generateVCFWithContacts(contacts);

        // Step 3: Extract all unique email addresses
        const emails = [...new Set(contacts.map(contact => contact.email))];

        // Step 4: Send emails in batches (e.g., 100 emails per batch)
        const batchSize = 100;
        await sendEmailsInBatches(emails, batchSize);

        console.log('Daily VCF generation and email sending completed successfully.');
    } catch (err) {
        console.error('Error during daily VCF generation and email sending:', err.message);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
