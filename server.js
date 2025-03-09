const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static frontend files

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Contact Schema & Model
const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", contactSchema);

// Serve frontend (fix "Cannot GET /" issue)
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
    res.send("Contact saved successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Generate & Send VCF File Every 3 Days
setInterval(async () => {
  try {
    const contacts = await Contact.find();
    if (contacts.length === 0) return;

    let vcfContent = "";
    contacts.forEach((contact) => {
      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL;TYPE=cell:${contact.phone}\nEMAIL:${contact.email}\nEND:VCARD\n`;
    });

    const filePath = path.join(__dirname, "contacts.vcf");
    fs.writeFileSync(filePath, vcfContent);

    await sendEmailsToUsers(filePath, contacts.map((c) => c.email));
    console.log("VCF file generated and emails sent!");

    // Optionally, clear database after sending
    // await Contact.deleteMany({});
  } catch (error) {
    console.error("Error generating VCF:", error);
  }
}, 3 * 24 * 60 * 60 * 1000); // Runs every 3 days

// Email Sending Function
async function sendEmailsToUsers(filePath, emails) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: emails.join(","),
    subject: "Your Contact VCF File",
    text: "Attached is your VCF file with all submitted contacts.",
    attachments: [{ filename: "contacts.vcf", path: filePath }],
  };

  await transporter.sendMail(mailOptions);
  console.log("Emails sent successfully!");
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
