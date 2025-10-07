import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard components
import EmployerDashboard from "./pages/Dashboard/EmployerDashboard";
import EmployerProfile from "./pages/Dashboard/EmployerProfile";

// Job components
import PostJob from "./pages/Jobs/PostJob";
import ManageJobs from "./pages/Jobs/ManageJobs";
import JobDetails from "./pages/Jobs/JobDetails";
import EditJob from "./pages/Jobs/EditJob";
import JobSeekerDashboard from "./pages/Dashboard/JobSeekerDashboard";
import JobSeekerProfile from "./pages/Dashboard/JobSeekerProfile";
import JobSeekerApplications from "./pages/Dashboard/JobSeekerApplications";
import JobSeekerJobList from "./pages/Jobs/JobSeekerJobList";
import JobSeekerApplyJob from "./pages/Jobs/JobSeekerApplyJob";
import MentorDashboard from "./pages/Dashboard/MentorDashboard";
import MentorshipList from "./pages/Mentorship/MentorshipList";

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Employer Routes */}
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/profile" element={<EmployerProfile />} />
        <Route path="/employer/post-job" element={<PostJob />} />
        <Route path="/employer/jobs" element={<ManageJobs />} />
        <Route path="/employer/jobs/:id/edit" element={<EditJob />} />

        {/* Public Job Details */}
        <Route path="/jobs/:id" element={<JobDetails />} />

      {/* Jobseeker Routes */}
      <Route path="/jobseeker/dashboard" element={<JobSeekerDashboard />} />
      <Route path="/jobseeker/profile" element={<JobSeekerProfile />} />
      <Route path="/jobseeker/applications" element={<JobSeekerApplications />} />
      <Route path="/jobseeker/jobs" element={<JobSeekerJobList />} />
      <Route path="/jobseeker/jobs/:jobId" element={<JobSeekerApplyJob />} />
      <Route path="/jobseeker/mentoring" element={<MentorshipList />} />

      {/* Mentor Routes */}
      <Route path="/mentor/dashboard" element={<MentorDashboard />} />
      </Routes>
  );
}


