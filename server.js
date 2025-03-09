const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cron = require("node-cron");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve frontend files

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Contact Schema & Model
const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", contactSchema);

// Serve Frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Submit Contact
app.post("/submit", async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone || !email) return res.status(400).send("All fields are required");

    const newContact = new Contact({ name, phone, email });
    await newContact.save();
    res.send("✅ Contact saved successfully!");
  } catch (error) {
    console.error("❌ Error saving contact:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Generate & Send VCF File (Runs Every 3 Days)
cron.schedule("0 0 */3 * *", async () => {
  console.log("📌 Running scheduled VCF generation & email task...");
  await generateAndSendVCF();
});

// Function: Generate & Email VCF File
async function generateAndSendVCF() {
  try {
    const contacts = await Contact.find();
    if (contacts.length === 0) {
      console.log("⚠ No contacts found, skipping email.");
      return;
    }

    const vcfContent = contacts.map(contact => 
      `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL;TYPE=cell:${contact.phone}\nEMAIL:${contact.email}\nEND:VCARD`
    ).join("\n");

    const vcfFilePath = path.join(__dirname, "contacts.vcf");
    fs.writeFileSync(vcfFilePath, vcfContent);

    const allEmails = contacts.map(c => c.email);
    await sendEmail(allEmails, vcfFilePath);
  } catch (error) {
    console.error("❌ Error generating/sending VCF file:", error);
  }
}

// Email Sending Function
async function sendEmail(recipients, filePath) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: recipients,
    subject: "📁 Your Contact VCF File",
    text: "Attached is the latest contact VCF file.",
    attachments: [{ filename: "contacts.vcf", path: filePath }],
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent successfully to ${recipients.length} users`);
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
