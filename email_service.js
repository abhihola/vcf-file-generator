const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(email, vcfContent) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your VCF file is ready",
        text: "Attached is your VCF file with all contacts.",
        attachments: [
            {
                filename: "contacts.vcf",
                content: vcfContent
            }
        ]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

module.exports = sendEmail;
