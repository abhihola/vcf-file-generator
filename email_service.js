const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVCFEmail = async (toEmail) => {
    try {
        const filePath = path.join(__dirname, 'public', 'contacts.vcf');
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Your WhatsApp Contacts VCF File 📂',
            text: `Thanks for using our service! This is the fastest way to gain WhatsApp contacts and boost your status views. 🚀
            
Support us by sharing the website link with others: 🔗 https://vcf-file-generator.onrender.com/

Keep growing your network! 😊`,
            attachments: [{ path: filePath }]
        };

        await transporter.sendMail(mailOptions);
        console.log(`VCF file sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendVCFToAll = async () => {
    const users = await mongoose.model('Contact').find({});
    users.forEach(user => sendVCFEmail(user.email));
};

module.exports = { sendVCFEmail, sendVCFToAll };
