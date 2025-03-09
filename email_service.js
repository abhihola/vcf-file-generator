const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Contact = require('./models/contact');

dotenv.config();

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Change if using another provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send VCF file to all users
const sendEmails = async () => {
    try {
        const contacts = await Contact.find();
        if (contacts.length === 0) {
            console.log('No contacts available for email.');
            return;
        }

        const emails = contacts.map(contact => contact.email).filter(email => email); // Get all emails

        if (emails.length === 0) {
            console.log('No valid emails found.');
            return;
        }

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: emails.join(','), // Send to all users
            subject: 'Your VCF Contact File',
            text: 'Attached is your VCF file containing all submitted contacts.',
            attachments: [{ path: './public/contacts.vcf' }]
        };

        let info = await transporter.sendMail(mailOptions);
        console.log('Emails sent successfully:', info.response);
    } catch (error) {
        console.error('Error sending emails:', error);
    }
};

module.exports = sendEmails;
