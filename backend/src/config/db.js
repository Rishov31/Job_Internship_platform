const mongoose = require("mongoose");

// Replace <username>, <password>, and <dbname>
const MONGO_URI = MONGODB_URI;
// Function to connect
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Exit process if connection fails
  }
};

module.exports = connectDB;
