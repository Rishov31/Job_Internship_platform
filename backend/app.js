require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const MONGO_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

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
app.use("/api/jobseeker", require("./src/routes/jobSeekerRoutes"));
app.use("/api/applications", require("./src/routes/applicationRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/resources", require("./src/routes/resourceRoutes"));
app.use("/api/cloudinary", require("./src/routes/cloudinaryRoutes"));

app.get("/", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.send("✅ MongoDB is connected!");
  } else {
    res.send("❌ MongoDB is NOT connected!");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Generic error handler (ensures JSON error responses)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});
