import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard components
import EmployerDashboard from "./pages/Dashboard/EmployerDashboard";
import EmployerProfile from "./pages/Dashboard/EmployerProfile";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import InvestorDashboard from "./pages/Dashboard/InvestorDashboard";
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import StudentStartupExplorer from "./pages/Dashboard/StudentStartupExplorer";
import StudentContributions from "./pages/Dashboard/StudentContributions";
import StudentAnalytics from "./pages/Dashboard/StudentAnalytics";
import StudentMentorship from "./pages/Dashboard/StudentMentorship";
import StudentResources from "./pages/Dashboard/StudentResources";
import StartupDashboard from "./pages/Dashboard/StartupDashboard";
import StartupProfile from "./pages/Dashboard/StartupProfile";

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

// Internship components
import InternshipList from "./pages/Internships/InternshipList";

// Resource components
import ResourceManagement from "./pages/Resources/ResourceManagement";
import ResourceList from "./pages/Resources/ResourceList";
import ResourceDetails from "./pages/Resources/ResourceDetails";

import MentorDashboard from "./pages/Dashboard/MentorDashboard";
import MentorshipList from "./pages/Mentorship/MentorshipList";
import MentorChats from "./pages/Mentorship/MentorChats";
import JobSeekerMentorChats from "./pages/Mentorship/JobSeekerMentorChats";
import MentorVideoCall from "./pages/Mentorship/MentorVideoCall";
import JobSeekerVideoCall from "./pages/Mentorship/JobSeekerVideoCall";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Employer Routes (job posting module) */}
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/profile" element={<EmployerProfile />} />
        <Route path="/employer/post-job" element={<PostJob />} />
        <Route path="/employer/jobs" element={<ManageJobs />} />
        <Route path="/employer/jobs/:id/edit" element={<EditJob />} />

        {/* Public Job Details */}
        <Route path="/jobs/:id" element={<JobDetails />} />

      {/* Student Ecosystem — shared shell + sub-pages */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="explore" element={<StudentStartupExplorer />} />
        <Route path="contributions" element={<StudentContributions />} />
        <Route path="mentorship" element={<StudentMentorship />} />
        <Route path="analytics" element={<StudentAnalytics />} />
        <Route path="resources" element={<StudentResources />} />
        <Route path="resources/:id" element={<ResourceDetails />} />
      </Route>

      {/* Jobseeker Routes (job & internship sub‑module) */}
      <Route path="/jobseeker/dashboard" element={<JobSeekerDashboard />} />
      <Route path="/jobseeker/profile" element={<JobSeekerProfile />} />
      <Route path="/jobseeker/applications" element={<JobSeekerApplications />} />
      <Route path="/jobseeker/jobs" element={<JobSeekerJobList />} />
      <Route path="/jobseeker/jobs/:id" element={<JobDetails />} />
      <Route path="/jobseeker/jobs/:jobId/apply" element={<JobSeekerApplyJob />} />
      <Route path="/jobseeker/internships" element={<InternshipList />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* Startup Ecosystem Dashboard (new) */}
      <Route path="/startup/dashboard" element={<StartupDashboard />} />
      <Route path="/startup/profile" element={<StartupProfile />} />
      <Route path="/admin/resources" element={<ResourceManagement />} />

      {/* Public Resource Routes */}
      <Route path="/resources" element={<ResourceList />} />
      <Route path="/resources/:id" element={<ResourceDetails />} />
      <Route path="/jobseeker/mentoring" element={<MentorshipList />} />
      <Route path="/jobseeker/mentor-chats" element={<JobSeekerMentorChats />} />
      <Route path="/jobseeker/video-call" element={<JobSeekerVideoCall />} />
      <Route path="/startup/mentor-chats" element={<JobSeekerMentorChats />} />
      <Route path="/startup/video-call" element={<JobSeekerVideoCall />} />
      <Route path="/investor/mentor-chats" element={<JobSeekerMentorChats />} />
      <Route path="/investor/video-call" element={<JobSeekerVideoCall />} />

      {/* Mentor Routes */}
      <Route path="/mentor/dashboard" element={<MentorDashboard />} />
      <Route path="/mentor/chat" element={<MentorChats />} />
      <Route path="/mentor/video-call" element={<MentorVideoCall />} />

      {/* Investor Routes */}
      <Route path="/investor/dashboard" element={<InvestorDashboard />} />

      {/* Notifications Route */}
      <Route path="/notifications" element={<Notifications />} />
      </Routes>
  );
}


