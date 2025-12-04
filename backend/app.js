require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// MongoDB connection with proper options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds - time to wait for server selection
  socketTimeoutMS: 45000, // 45 seconds - time to wait for socket operations
  connectTimeoutMS: 30000, // 30 seconds - time to wait for initial connection
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain at least 5 socket connections
  retryWrites: true,
  w: 'majority',
  // Retry connection on failure
  retryReads: true,
};

// Connect to MongoDB and wait for connection before starting server
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
    console.log("✅ MongoDB Connected");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    // Start server only after MongoDB is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      
      // Initialize scheduler after server starts and DB is connected
      const schedulerService = require('./src/services/schedulerService');
      schedulerService.init();
      schedulerService.start();
      console.log('📅 Scheduler initialized and started');
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    console.error("Full error:", err);
    
    // If connection fails, still start server but warn about DB
    console.warn("⚠️ Starting server without database connection. Some features may not work.");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (without DB)`);
    });
  }
};

// Start the application
startServer();

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  // Attempt to reconnect after 5 seconds
  setTimeout(() => {
    mongoose.connect(MONGO_URI, mongooseOptions)
      .then(() => console.log("✅ MongoDB reconnected"))
      .catch((err) => console.error("❌ Reconnection failed:", err.message));
  }, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
// Increase body size limits to allow base64 file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/jobs", require("./src/routes/jobRoutes"));
app.use("/api/internships", require("./src/routes/internshipRoutes"));
app.use("/api/jobseeker", require("./src/routes/jobSeekerRoutes"));
app.use("/api/applications", require("./src/routes/applicationRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/resources", require("./src/routes/resourceRoutes"));
app.use("/api/cloudinary", require("./src/routes/cloudinaryRoutes"));
app.use("/api/mentors", require("./src/routes/mentorRoutes"));
app.use("/api/bookings", require("./src/routes/bookingRoutes"));
app.use("/api/scraper", require("./src/routes/scraperRoutes"));

app.get("/", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.send("✅ MongoDB is connected!");
  } else {
    res.send("❌ MongoDB is NOT connected!");
  }
});

// Server startup is now handled in startServer() function above

// Generic error handler (ensures JSON error responses)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});
