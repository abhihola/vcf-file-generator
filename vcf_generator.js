const Contact = require("./models/contact");

async function generateVCF() {
    try {
        const contacts = await Contact.find({});
        if (contacts.length === 0) return null;

        const vcfContent = contacts.map(contact => `
BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL:${contact.phone}
EMAIL:${contact.email}
END:VCARD
        `).join("\n");

        return vcfContent;
    } catch (err) {
        console.error("Error generating VCF:", err);
        return null;
    }
}

module.exports = generateVCF;
