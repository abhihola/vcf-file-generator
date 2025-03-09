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

// Serve frontend
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

// ✅ **TEST EMAIL FUNCTIONALITY** (Visit: `/send-test-email?email=your_email@example.com`)
app.get("/send-test-email", async (req, res) => {
  const testEmail = req.query.email;
  if (!testEmail) return res.status(400).send("Please provide an email in the URL.");

  const testFilePath = path.join(__dirname, "test.vcf");
  fs.writeFileSync(testFilePath, `BEGIN:VCARD\nVERSION:3.0\nFN:Test User\nTEL;TYPE=cell:+123456789\nEMAIL:${testEmail}\nEND:VCARD\n`);

  try {
    await sendEmail(testEmail, testFilePath);
    res.send(`Test email sent to ${testEmail}`);
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).send("Failed to send email.");
  }
});

// Email Sending Function
async function sendEmail(toEmail, filePath) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: toEmail,
    subject: "Test VCF Email",
    text: "This is a test email with a sample VCF file.",
    attachments: [{ filename: "test.vcf", path: filePath }],
  };

  await transporter.sendMail(mailOptions);
  console.log(`Test email sent to ${toEmail}`);
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
