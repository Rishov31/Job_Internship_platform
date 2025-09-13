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
    </Routes>
  );
}


