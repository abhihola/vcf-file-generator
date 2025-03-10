const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Contact = require('./models/contact');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send VCF file
const sendVCF = async (to) => {
    try {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: 'Your WhatsApp Contacts VCF File',
            text: 'Thanks for using our service! This is the fastest way to gain WhatsApp contacts and boost your status views. 🚀\n\nSupport us by sharing the website link with others: 🔗 https://vcf-file-generator.onrender.com/\n\nKeep growing your network! 😊',
            attachments: [{ path: 'public/contacts.vcf' }]
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`VCF email sent to ${to}:`, info.response);
    } catch (error) {
        console.error('Error sending VCF email:', error);
    }
};

// Send VCF to all users
const sendVCFToAllUsers = async () => {
    const contacts = await Contact.find({});
    for (const contact of contacts) {
        await sendVCF(contact.email);
    }
};

module.exports = { sendVCF, sendVCFToAllUsers };
