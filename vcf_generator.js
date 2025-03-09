const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Contact = require('./models/contact');

const generateVCF = async () => {
    try {
        const contacts = await Contact.find();
        if (contacts.length === 0) {
            console.log('No contacts found.');
            return null;
        }

        let vcfData = '';
        contacts.forEach(contact => {
            vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL;TYPE=cell:${contact.phone}\nEMAIL:${contact.email}\nEND:VCARD\n`;
        });

        const vcfPath = path.join(__dirname, 'public', 'contacts.vcf');
        fs.writeFileSync(vcfPath, vcfData);
        console.log('VCF file generated successfully.');
        return vcfPath; // Return file path for email attachment
    } catch (err) {
        console.error('Error generating VCF file:', err);
        return null;
    }
};

module.exports = { generateVCF };
