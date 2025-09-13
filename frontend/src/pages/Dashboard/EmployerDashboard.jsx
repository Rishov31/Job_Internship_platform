import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getJobStats, getEmployerJobs } from "../../api/jobApi";
import { me } from "../../api/authApi";

export default function EmployerDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    pausedJobs: 0,
    closedJobs: 0,
    totalApplications: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, statsData, jobsData] = await Promise.all([
          me(),
          getJobStats(),
          getEmployerJobs({ limit: 5 }),
        ]);
        
        setUser(userData);
        setStats(statsData);
        setRecentJobs(jobsData.jobs);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      color: "bg-blue-500",
      icon: "📋",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      color: "bg-green-500",
      icon: "✅",
    },
    {
      title: "Applications",
      value: stats.totalApplications,
      color: "bg-purple-500",
      icon: "📄",
    },
    {
      title: "Paused Jobs",
      value: stats.pausedJobs,
      color: "bg-yellow-500",
      icon: "⏸️",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-sky-600 font-extrabold text-xl">INTERNSHALA</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700 font-medium">Employer Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user?.fullName}</span>
              </span>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName}!</h1>
          <p className="text-gray-600 mt-2">Manage your job postings and track applications</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/employer/post-job"
            className="bg-sky-600 text-white p-6 rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-4"
          >
            <div className="text-2xl">➕</div>
            <div>
              <h3 className="font-semibold">Post New Job</h3>
              <p className="text-sm opacity-90">Create a new job posting</p>
            </div>
          </Link>
          <Link
            to="/employer/profile"
            className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-4"
          >
            <div className="text-2xl">👤</div>
            <div>
              <h3 className="font-semibold">Complete Profile</h3>
              <p className="text-sm opacity-90">Update your company profile</p>
            </div>
          </Link>
          <Link
            to="/employer/jobs"
            className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-4"
          >
            <div className="text-2xl">📋</div>
            <div>
              <h3 className="font-semibold">Manage Jobs</h3>
              <p className="text-sm opacity-90">View and edit your jobs</p>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white text-xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <Link
                to="/employer/jobs"
                className="text-sky-600 hover:text-sky-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {recentJobs.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                <p className="text-gray-600 mb-4">Start by posting your first job to attract candidates</p>
                <Link
                  to="/employer/post-job"
                  className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
                >
                  Post Your First Job
                </Link>
              </div>
            ) : (
              recentJobs.map((job) => (
                <div key={job._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'active' ? 'bg-green-100 text-green-800' :
                          job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {job.applicationsCount} applications
                        </span>
                        <span className="text-xs text-gray-500">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/employer/jobs/${job._id}/edit`}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/jobs/${job._id}`}
                        className="px-3 py-1 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


