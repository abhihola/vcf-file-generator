const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fs = require('fs');
const Contact = require('./models/contact');  // Assuming you have a Contact model for your emails

dotenv.config();

// Load the last processed batch from the progress file
const getProgress = () => {
    try {
        const data = fs.readFileSync('./progress.json');
        return JSON.parse(data);
    } catch (error) {
        return { lastProcessedBatch: 0 };  // Default to batch 0 if no progress file exists
    }
};

// Save the last processed batch to the progress file
const saveProgress = (batch) => {
    const progress = { lastProcessedBatch: batch };
    fs.writeFileSync('./progress.json', JSON.stringify(progress));
};

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send email with VCF attachment
const sendVCF = async (to) => {
    try {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: "Your VCF File is Ready!",
            text: `Thanks for using our service! This is the fastest way to gain WhatsApp contacts and boost your status views. 🚀\n\nSupport us by sharing the website link with others: 🔗 https://vcf-file-generator.onrender.com/\n\nKeep growing your network! 😊`,
            attachments: [{ path: './contacts.vcf' }]
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`VCF sent to ${to}:`, info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Send emails to all users in batches
const sendToAllUsers = async () => {
    try {
        const contacts = await Contact.find({});
        const batchSize = 100;  // Send 100 emails per batch
        let batch = [];
        const progress = getProgress();  // Get last processed batch from progress file

        // Start from the batch after the last processed batch
        let startIndex = progress.lastProcessedBatch * batchSize;

        for (let i = startIndex; i < contacts.length; i++) {
            batch.push(contacts[i].email);

            // When the batch is full, send it and save progress
            if (batch.length === batchSize || i === contacts.length - 1) {
                console.log(`Sending batch ${Math.floor(i / batchSize) + 1}...`);
                for (const email of batch) {
                    await sendVCF(email);
                }

                // Save the progress after each batch is sent
                saveProgress(Math.floor(i / batchSize) + 1);

                // Wait for 1 hour before sending the next batch
                console.log(`Waiting for 1 hour before sending the next batch...`);
                await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));  // Wait for 1 hour

                batch = [];  // Clear the batch for the next set of emails
            }
        }
        console.log("All emails sent!");
    } catch (error) {
        console.error("Error sending emails:", error);
    }
};

module.exports = { sendVCF, sendToAllUsers };
