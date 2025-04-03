const cron = require("node-cron");
const mongoose = require("mongoose");
const generateVCF = require("./vcf_generator");
const sendEmail = require("./email_service");
const Contact = require("./models/contact");
const VCFFile = require("./models/vcfFile");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

cron.schedule("0 0 */3 * *", async () => {
    console.log("Running VCF generation task...");

    const vcfContent = await generateVCF();
    if (!vcfContent) return console.log("No contacts available.");

    try {
        // Save the VCF file in MongoDB
        const newVCF = new VCFFile({ content: vcfContent, createdAt: new Date() });
        await newVCF.save();

        // Get all emails and send the VCF
        const contacts = await Contact.find({});
        contacts.forEach(contact => {
            sendEmail(contact.email, vcfContent);
        });

        // Clear contacts after sending
        await Contact.deleteMany({});
        console.log("Contacts cleared after sending VCF.");
    } catch (error) {
        console.error("Error processing VCF:", error);
    }
}, {
    scheduled: true,
    timezone: "UTC"
});
