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
app.use(express.static('public'));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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

// Schedule VCF generation at 2:29 PM Nigerian time
nodeCron.schedule('29 14 * * *', async () => {
    console.log(`[${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}] Running 2:29 PM VCF generation...`);
    try {
        await vcfGenerator.generateVCF();
        console.log('VCF generation completed before email sending.');
    } catch (error) {
        console.error('VCF generation failed:', error);
    }
}, {
    timezone: 'Africa/Lagos'
});

// Schedule email sending at 2:30 PM Nigerian time
nodeCron.schedule('30 14 * * *', async () => {
    console.log(`[${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}] Sending scheduled emails at 2:30 PM...`);
    try {
        await emailService.sendToAllUsers();
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
