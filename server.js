const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

// Store contacts in a JSON file
const contactsFile = "contacts.json";

// Endpoint to save contacts
app.post("/submit", (req, res) => {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const newContact = { name, phone, email };

    fs.readFile(contactsFile, (err, data) => {
        let contacts = [];
        if (!err) {
            contacts = JSON.parse(data);
        }
        contacts.push(newContact);

        fs.writeFile(contactsFile, JSON.stringify(contacts, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Error saving contact" });
            res.json({ message: "Contact saved successfully!" });
        });
    });
});

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
