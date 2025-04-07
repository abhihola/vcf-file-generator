const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodeCron = require('node-cron');
const vcfGenerator = require('./vcf_generator');
const emailService = require('./email_service');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan'); // Logging middleware

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files
app.use(morgan('dev')); // Log HTTP requests

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later."
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/generate-vcf', async (req, res) => {
    try {
        await vcfGenerator.generateVCF();
        res.status(200).send({ message: 'VCF file generated successfully.' });
    } catch (error) {
        console.error('Error generating VCF:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Schedule VCF generation at 10:29 AM Nigerian time
nodeCron.schedule('29 10 * * *', async () => {
    console.log('Running 10:29 AM VCF generation...');
    try {
        await vcfGenerator.generateVCF();
        console.log('VCF generation before email completed.');
    } catch (error) {
        console.error('VCF generation before email failed:', error);
    }
}, {
    timezone: 'Africa/Lagos'
});

// Schedule email sending at 10:30 AM Nigerian time
nodeCron.schedule('30 10 * * *', async () => {
    console.log('Sending scheduled emails at 10:30 AM...');
    try {
        await emailService.sendEmails(); // Adjust this function as needed in your email_service.js
        console.log('Scheduled emails sent successfully.');
    } catch (error) {
        console.error('Scheduled email sending failed:', error);
    }
}, {
    timezone: 'Africa/Lagos'
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
