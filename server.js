const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const nodeCron = require('node-cron');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Sample route
app.get('/', (req, res) => {
    res.send('VCF Generator API is running.');
});

// Example node-cron job (runs every 3 days)
nodeCron.schedule('0 0 */3 * *', () => {
    console.log('Running scheduled task: Generate VCF files and send emails.');
    // Call your VCF generation and email functions here
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
