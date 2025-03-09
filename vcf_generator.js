const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Contact = require('./models/contact');

const generateVCF = async () => {
    const contacts = await Contact.find({});
    if (contacts.length === 0) return null;

    const vcfData = contacts.map(contact => `
BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL;TYPE=cell:${contact.phone}
EMAIL:${contact.email}
END:VCARD
    `).join('\n');

    const vcfPath = path.join(__dirname, 'contacts.vcf');
    fs.writeFileSync(vcfPath, vcfData);
    return vcfPath;
};

module.exports = { generateVCF };
