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
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/jobs", require("./src/routes/jobRoutes"));
app.use("/api/jobseeker", require("./src/routes/jobSeekerRoutes"));
app.use("/api/applications", require("./src/routes/applicationRoutes"));
app.use("/api/mentors", require("./src/routes/mentorRoutes"));
app.use("/api/bookings", require("./src/routes/bookingRoutes"));

app.get("/", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.send("✅ MongoDB is connected!");
  } else {
    res.send("❌ MongoDB is NOT connected!");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
