const nodemailer = require("nodemailer");
const AdminMessage = require("./models/adminMessage");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVCF(email) {
  try {
    const adminMessage = await AdminMessage.findOne();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your VCF File",
      text: `${adminMessage ? adminMessage.message : "Enjoy your VCF file!"}\n\nKeep growing your network! 😊`,
      attachments: [{ path: "./contacts.vcf" }],
    };
    await transporter.sendMail(mailOptions);
    console.log("VCF email sent to:", email);
  } catch (error) {
    console.error("Error sending VCF email:", error);
  }
}

async function sendVCFToAll() {
  // Logic to fetch all user emails and send the updated VCF file daily
}

module.exports = { sendVCF, sendVCFToAll };
