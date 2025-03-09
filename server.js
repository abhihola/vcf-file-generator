const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
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

// Serve the Home Page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
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
