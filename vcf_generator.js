const fs = require('fs');
const Contact = require('./models/contact');

const generateVCF = async () => {
    const contacts = await Contact.find({});
    let vcfContent = '';

    contacts.forEach(contact => {
        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL;TYPE=CELL:${contact.phone}\nEMAIL:${contact.email}\nEND:VCARD\n\n`;
    });

    fs.writeFileSync('public/contacts.vcf', vcfContent);
    console.log('VCF file updated.');
};

module.exports = { generateVCF };
