const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const cors = require("cors");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => console.log("✅ MongoDB Connected"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB Error:", err));

const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
});

const Contact = mongoose.model("Contact", contactSchema);

app.post("/submit", async (req, res) => {
  console.log("📥 Received submission:", req.body);

  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      console.error("⚠ Missing fields:", { name, phone, email });
      return res.status(400).send("All fields are required");
    }

    const newContact = new Contact({ name, phone, email });
    await newContact.save();
    console.log("✅ Contact saved:", newContact);

    res.send("✅ Contact saved successfully!");
  } catch (error) {
    console.error("❌ Error saving contact:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Function to generate VCF file
const generateVCF = async () => {
  try {
    const contacts = await Contact.find();
    if (contacts.length === 0) return null;

    const vcfData = contacts
      .map(
        (contact) =>
          `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL:${contact.phone}\nEMAIL:${contact.email}\nEND:VCARD`
      )
      .join("\n");

    const filename = `contacts_${uuidv4()}.vcf`;
    fs.writeFileSync(filename, vcfData);
    console.log("✅ VCF File Created:", filename);

    return { filename, contacts };
  } catch (error) {
    console.error("❌ Error generating VCF:", error);
    return null;
  }
};

// Function to send email with VCF
const sendVCFEmail = async () => {
  try {
    const { filename, contacts } = await generateVCF();
    if (!filename) return console.log("⚠ No contacts to send.");

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const contact of contacts) {
      let mailOptions = {
        from: process.env.EMAIL_USER,
        to: contact.email,
        subject: "Your Contact List VCF File",
        text: "Attached is your VCF contact file.",
        attachments: [{ filename, path: filename }],
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to: ${contact.email}`);
    }

    fs.unlinkSync(filename);
  } catch (error) {
    console.error("❌ Error sending emails:", error);
  }
};

// Schedule email sending every 3 days
cron.schedule("0 0 */3 * *", sendVCFEmail);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
