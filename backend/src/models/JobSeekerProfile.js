const mongoose = require("mongoose");

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    personalInfo: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      gender: { type: String, enum: ["male", "female", "other", "prefer-not-to-say"] },
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
      profilePicture: String,
    },
    professionalInfo: {
      currentTitle: String,
      yearsOfExperience: { type: Number, default: 0 },
      jobType: [{ type: String, enum: ["full-time", "part-time", "contract", "internship", "freelance"] }],
      workLocation: { type: String, enum: ["on-site", "remote", "hybrid"], default: "on-site" },
      noticePeriod: String,
    },
    education: [
      { institution: String, degree: String, fieldOfStudy: String, startDate: Date, endDate: Date, description: String }
    ],
    experience: [
      { company: String, position: String, startDate: Date, endDate: Date, location: String, description: String }
    ],
    skills: { technical: [String], soft: [String] },
    resume: { fileName: String, fileUrl: String, uploadedAt: Date },
    preferences: { jobCategories: [String], locations: [String], jobAlerts: { type: Boolean, default: true } },
    isProfileComplete: { type: Boolean, default: false },
    profileCompletionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobSeekerProfile", jobSeekerProfileSchema);


