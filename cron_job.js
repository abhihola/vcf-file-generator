const cron = require("node-cron");
const fs = require("fs");
const generateVCF = require("./vcf_generator");
const sendEmail = require("./email_service");

cron.schedule("0 0 */3 * *", () => {
    console.log("Running VCF generation task...");

    const vcfPath = generateVCF();
    if (!vcfPath) return;

    fs.readFile("contacts.json", (err, data) => {
        if (err) return console.error("Error reading contacts:", err);

        const contacts = JSON.parse(data);
        contacts.forEach(contact => {
            sendEmail(contact.email, `https://yourwebsite.com/${vcfPath}`);
        });

        // Clear contacts after sending
        fs.writeFileSync("contacts.json", "[]");
    });
}, {
    scheduled: true,
    timezone: "UTC"
});
