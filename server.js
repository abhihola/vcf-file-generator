const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => console.log("✅ MongoDB Connected"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB Error:", err));

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
});

const Contact = mongoose.model("Contact", contactSchema);

// Root Route (To Test If API is Running)
app.get("/", (req, res) => {
  res.send("✅ VCF Generator API is running.");
});

// Submit Contact Route
app.post("/submit", async (req, res) => {
  console.log("📥 Received submission:", req.body);

  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).send("⚠ All fields are required");
    }

    const newContact = new Contact({ name, phone, email });
    await newContact.save();
    console.log("✅ Contact saved:", newContact);

    res.send("✅ Contact saved successfully!");
  } catch (error) {
    console.error("❌ Error saving contact:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
