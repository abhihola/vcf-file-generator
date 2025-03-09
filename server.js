const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Define Contact Schema
const ContactSchema = new mongoose.Schema({
    name: String,
    whatsapp: String,
    email: String
});
const Contact = mongoose.model("Contact", ContactSchema);

// Submit Contact Details
app.post("/submit", async (req, res) => {
    try {
        const { name, whatsapp, email } = req.body;
        const newContact = new Contact({ name, whatsapp, email });
        await newContact.save();
        res.json({ message: "Contact saved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save contact" });
    }
});

// Send Email Function
const sendEmail = async (to, subject, text, attachmentPath) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        attachments: [{ filename: "contacts.vcf", path: attachmentPath }]
    };

    await transporter.sendMail(mailOptions);
};

// Cron Job to Generate VCF & Send Emails (Every 3 Days)
const nodeCron = require("node-cron");
const fs = require("fs");

nodeCron.schedule("0 0 */3 * *", async () => {
    try {
        const contacts = await Contact.find();
        if (contacts.length === 0) return;

        let vcfContent = "";
        contacts.forEach(contact => {
            vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL;TYPE=cell:${contact.whatsapp}\nEMAIL:${contact.email}\nEND:VCARD\n`;
        });

        const filePath = "./contacts.vcf";
        fs.writeFileSync(filePath, vcfContent);

        // Send VCF to All Users
        for (const contact of contacts) {
            await sendEmail(contact.email, "Your VCF File", "Here is your VCF file.", filePath);
        }

        console.log("VCF files sent successfully!");
    } catch (error) {
        console.log("Error generating/sending VCF:", error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
