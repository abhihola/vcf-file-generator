const fs = require('fs');
const path = require('path');
const Contact = require('./models/contact');

async function generateVCF() {
    try {
        const contacts = await Contact.find();
        let vcfData = '';

        contacts.forEach(contact => {
            vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nTEL;TYPE=cell:${contact.phone}\nEMAIL:${contact.email}\nEND:VCARD\n\n`;
        });

        const filePath = path.join(__dirname, 'public', 'contacts.vcf');
        fs.writeFileSync(filePath, vcfData);
        console.log('VCF file generated successfully:', filePath);

        return filePath;
    } catch (error) {
        console.error('Error generating VCF:', error);
        throw error;
    }
}

module.exports = { generateVCF };
