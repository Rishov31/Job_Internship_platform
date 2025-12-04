const mongoose = require("mongoose");
require("dotenv").config();

// Get MongoDB URI from environment variables
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Function to connect
const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(MONGO_URI, options);
    console.log("✅ MongoDB connected successfully");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Full error:", error);
    
    // Don't exit immediately, allow the app to handle retries
    // process.exit(1);
    throw error;
  }
};

module.exports = connectDB;
