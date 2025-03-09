const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const fs = require("fs");
const vCardsJS = require("vcards-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// Define Contact Schema
const contactSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String
});

const Contact = mongoose.model("Contact", contactSchema);

// ✅ Fix: Route for Homepage (Prevents "Cannot GET /" Error)
app.get("/", (req, res) => {
    res.send("Welcome to the VCF Generator API! Use POST /submit to add contacts.");
});

// ✅ Route to Submit Contacts
app.post("/submit", async (req, res) => {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
        return res.status(400).json({ error: "All fields are required (name, phone, email)" });
    }

    const newContact = new Contact({ name, phone, email });
    await newContact.save();

    res.json({ message: "Contact saved successfully!" });
});

// ✅ Cron Job: Runs Every 3 Days to Generate VCF & Send Emails
cron.schedule("0 0 */3 * *", async () => {
    console.log("Generating VCF file...");

    const contacts = await Contact.find();
    if (contacts.length === 0) {
        console.log("No contacts found.");
        return;
    }

    let vCardData = "";
    contacts.forEach(contact => {
        let vCard = vCardsJS();
        vCard.firstName = contact.name;
        vCard.cellPhone = contact.phone;
        vCard.email = contact.email;
        vCardData += vCard.getFormattedString() + "\n";
    });

    const filePath = "contacts.vcf";
    fs.writeFileSync(filePath, vCardData);
    console.log("VCF File Generated!");

    // Send Email with VCF Attachment
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    contacts.forEach(async (contact) => {
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: contact.email,
            subject: "Your VCF File",
            text: "Attached is the latest VCF file with all submitted contacts.",
            attachments: [{ filename: "contacts.vcf", path: filePath }]
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${contact.email}`);
        } catch (error) {
            console.log(`Error sending email to ${contact.email}:`, error);
        }
    });

    // Store VCF File in MongoDB
    const vcfData = fs.readFileSync(filePath);
    const vcfCollection = mongoose.connection.collection("vcf_files");
    await vcfCollection.insertOne({ file: vcfData, createdAt: new Date() });

    console.log("VCF File Saved to MongoDB!");

    // Clear old contacts
    await Contact.deleteMany({});
    console.log("Contacts Cleared!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
