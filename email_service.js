const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Contact = require('./models/contact');

dotenv.config();

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a VCF file to a single recipient.
 * @param {string} to - The recipient's email address.
 */
const sendVCF = async (to) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: "Your VCF File is Ready!",
            text: `Thanks for using our service! This is the fastest way to gain WhatsApp contacts and boost your status views but soon this email might stop. 🚀\n\nJoin this channel to keep receiving the daily vcf : 🔗 https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04/\n\nKeep growing your network! 😊`,
            attachments: [{ path: './contacts.vcf' }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`VCF sent to ${to}:`, info.response);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error.message);
    }
};

/**
 * Sends emails to a batch of recipients.
 * @param {string[]} emails - Array of recipient email addresses.
 */
const sendToBatch = async (emails) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emails.join(','), // Join email addresses into a comma-separated string
            subject: "Your VCF File is Ready!",
            text: `Thanks for using our service! This is the fastest way to gain WhatsApp contacts and boost your status views but soon this email might stop. 🚀\n\nJoin this channel to keep receiving the daily vcf : 🔗 https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04/\n\nKeep growing your network! 😊`,
            attachments: [{ path: './contacts.vcf' }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Batch of ${emails.length} emails sent successfully:`, info.response);
    } catch (error) {
        console.error(`Error sending batch of ${emails.length} emails:`, error.message);
    }
};

/**
 * Sends VCF files to all users in batches.
 * @param {number} batchSize - Number of emails per batch.
 */
const sendToAllUsers = async (batchSize = 100) => {
    try {
        // Fetch all unique email addresses from the database
        const contacts = await Contact.find({});
        const emails = [...new Set(contacts.map(contact => contact.email))];

        if (emails.length === 0) {
            console.log('No contacts found in the database.');
            return;
        }

        console.log(`Sending VCF files to ${emails.length} unique users in batches of ${batchSize}...`);

        // Send emails in batches
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            await sendToBatch(batch);
        }

        console.log('All VCF files sent successfully.');
    } catch (error) {
        console.error('Error sending VCF files to all users:', error.message);
    }
};

module.exports = { sendVCF, sendToBatch, sendToAllUsers };
