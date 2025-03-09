const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function sendEmail(email, fileLink) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your VCF file is ready",
        text: `Download your VCF file here: ${fileLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("Error sending email:", error);
        else console.log("Email sent:", info.response);
    });
}

module.exports = sendEmail;
