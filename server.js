const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const nodeCron = require("node-cron");
const vcfGenerator = require("./vcf_generator");
const emailService = require("./email_service");
const path = require("path");
const authMiddleware = require("./middleware/auth");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Serve frontend files

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Contact Model
const Contact = require("./models/contact");
const Referral = require("./models/referral");
const AdminMessage = require("./models/adminMessage");

// Ensure default admin message exists
async function ensureDefaultMessage() {
  const existingMessage = await AdminMessage.findOne();
  if (!existingMessage) {
    await AdminMessage.create({ message: "Default message" });
  }
}
ensureDefaultMessage();

// Serve the homepage with referral requirement
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "referral.html"));
});

// Route to handle referral tracking
app.post("/track-referral", async (req, res) => {
  try {
    const { referrer } = req.body;
    if (!referrer) {
      return res.status(400).json({ error: "Invalid referral" });
    }
    await Referral.create({ referrer });
    res.status(200).json({ message: "Referral recorded" });
  } catch (error) {
    res.status(500).json({ error: "Failed to track referral" });
  }
});

// Route to submit contact details
app.post("/submit", async (req, res) => {
  try {
    const { name, phone, email, countryCode } = req.body;
    const formattedPhone = phone.replace(/^\+?[\d]+/, "").trim(); // Remove country code if already included

    // Check if the number already exists
    const existingContact = await Contact.findOne({ phone: formattedPhone });
    if (existingContact) {
      return res.status(400).json({ error: "Number already exists in database" });
    }

    const newContact = new Contact({ name, phone: `${countryCode}${formattedPhone}`, email });
    await newContact.save();

    setTimeout(async () => {
      await vcfGenerator.generateVCF();
      await emailService.sendVCF(email);
    }, 60000); // Send email after 1 minute

    res.status(200).json({ message: "Contact saved successfully. You'll receive an email soon." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve the VCF download test page
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Admin Panel for Custom Messages
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.post("/admin/message", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    await AdminMessage.findOneAndUpdate({}, { message }, { upsert: true });
    res.status(200).json({ message: "Admin message updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

// Schedule daily VCF generation and email sending at midnight
nodeCron.schedule("0 0 * * *", async () => {
  console.log("Generating new VCF file...");
  await vcfGenerator.generateVCF();
  await emailService.sendVCFToAll();
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
