const fs = require("fs");
const path = require("path");

const contactsFile = "contacts.json";
const uploadsDir = "uploads/";

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

function generateVCF() {
    fs.readFile(contactsFile, (err, data) => {
        if (err) return console.error("Error reading contacts:", err);

        const contacts = JSON.parse(data);
        if (contacts.length === 0) return console.log("No contacts to process.");

        const vcfContent = contacts.map(contact => `
BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL:${contact.phone}
EMAIL:${contact.email}
END:VCARD
        `).join("\n");

        const filePath = path.join(uploadsDir, `contacts_${Date.now()}.vcf`);
        fs.writeFileSync(filePath, vcfContent);
        console.log(`VCF file generated: ${filePath}`);

        return filePath;
    });
}

module.exports = generateVCF;
