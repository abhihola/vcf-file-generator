const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Contact = require('./models/contact');

const generateVCF = async () => {
    const contacts = await Contact.find({});
    const vcfContent = contacts.map(contact => {
        return `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL;TYPE=cell:${contact.phone}
EMAIL:${contact.email}
END:VCARD`;
    }).join('\n');

    const filePath = path.join(__dirname, 'public', 'contacts.vcf');
    fs.writeFileSync(filePath, vcfContent);
    console.log('VCF file generated successfully!');
    return filePath;
};

module.exports = { generateVCF };
