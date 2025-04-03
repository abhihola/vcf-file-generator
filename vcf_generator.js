const fs = require('fs');
const mongoose = require('mongoose');
const Contact = require('./models/contact');

async function generateVCF() {
    try {
        const contacts = await Contact.find();
        let vcfContent = '';

        contacts.forEach(contact => {
            vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL:${contact.phone}
EMAIL:${contact.email}
END:VCARD\n`;
        });

        fs.writeFileSync('contacts.vcf', vcfContent);
        console.log('VCF file generated successfully.');
    } catch (err) {
        console.error('Error generating VCF file:', err);
    }
}

module.exports = { generateVCF };
