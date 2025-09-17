// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { getJobStats, getEmployerJobs } from "../../api/jobApi";
// import { me } from "../../api/authApi";

// export default function EmployerDashboard() {
//   const [user, setUser] = useState(null);
//   const [stats, setStats] = useState({
//     totalJobs: 0,
//     activeJobs: 0,
//     pausedJobs: 0,
//     closedJobs: 0,
//     totalApplications: 0,
//   });
//   const [recentJobs, setRecentJobs] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [userData, statsData, jobsData] = await Promise.all([
//           me(),
//           getJobStats(),
//           getEmployerJobs({ limit: 5 }),
//         ]);
        
//         setUser(userData);
//         setStats(statsData);
//         setRecentJobs(jobsData.jobs);
//       } catch (error) {
//         console.error("Failed to fetch dashboard data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="relative">
//           <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
//           <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-purple-400 border-l-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
//         </div>
//       </div>
//     );
//   }

//   const statCards = [
//     {
//       title: "Total Jobs",
//       value: stats.totalJobs,
//       color: "from-blue-500 to-blue-600",
//       bgColor: "from-blue-50/50 to-blue-100/30",
//       icon: "📋",
//     },
//     {
//       title: "Active Jobs",
//       value: stats.activeJobs,
//       color: "from-emerald-500 to-emerald-600",
//       bgColor: "from-emerald-50/50 to-emerald-100/30",
//       icon: "✅",
//     },
//     {
//       title: "Applications",
//       value: stats.totalApplications,
//       color: "from-purple-500 to-purple-600",
//       bgColor: "from-purple-50/50 to-purple-100/30",
//       icon: "📄",
//     },
//     {
//       title: "Paused Jobs",
//       value: stats.pausedJobs,
//       color: "from-amber-500 to-amber-600",
//       bgColor: "from-amber-50/50 to-amber-100/30",
//       icon: "⏸️",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Header */}
//       <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center gap-4">
//               <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                 HireMe
//               </span>
//               <div className="w-px h-6 bg-gradient-to-b from-gray-300 to-gray-400"></div>
//               <span className="text-gray-700 font-semibold">Employer Dashboard</span>
//             </div>
//             <div className="flex items-center gap-4">
//               <span className="hidden sm:block text-sm text-gray-600">
//                 Welcome, <span className="font-semibold text-gray-800">{user?.fullName}</span>
//               </span>
//               <button className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 text-sm font-medium transition-all duration-300 shadow-lg shadow-red-200/40 hover:shadow-red-300/60 transform hover:scale-105">
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Welcome Section */}
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
//             Welcome back, {user?.fullName}!
//           </h1>
//           <p className="text-gray-600 text-lg">Manage your job postings and track applications</p>
//         </div>

//         {/* Quick Actions */}
//         <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
//           <Link
//             to="/employer/post-job"
//             className="group relative bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/70 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
//           >
//             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
//             <div className="relative flex items-center gap-4">
//               <div className="text-3xl group-hover:scale-110 transition-transform duration-300">➕</div>
//               <div>
//                 <h3 className="font-bold text-lg">Post New Job</h3>
//                 <p className="text-sm opacity-90">Create a new job posting</p>
//               </div>
//             </div>
//           </Link>

//           <Link
//             to="/employer/profile"
//             className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/70 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
//           >
//             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
//             <div className="relative flex items-center gap-4">
//               <div className="text-3xl group-hover:scale-110 transition-transform duration-300">👤</div>
//               <div>
//                 <h3 className="font-bold text-lg">Complete Profile</h3>
//                 <p className="text-sm opacity-90">Update your company profile</p>
//               </div>
//             </div>
//           </Link>

//           <Link
//             to="/employer/jobs"
//             className="group relative bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-purple-200/50 hover:shadow-purple-300/70 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
//           >
//             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
//             <div className="relative flex items-center gap-4">
//               <div className="text-3xl group-hover:scale-110 transition-transform duration-300">📋</div>
//               <div>
//                 <h3 className="font-bold text-lg">Manage Jobs</h3>
//                 <p className="text-sm opacity-90">View and edit your jobs</p>
//               </div>
//             </div>
//           </Link>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {statCards.map((stat, index) => (
//             <div
//               key={index}
//               className="group relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white/30 hover:bg-white/90 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1"
//             >
//               <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`}></div>
//               <div className="relative flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
//                   <p className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
//                     {stat.value}
//                   </p>
//                 </div>
//                 <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl text-white text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
//                   {stat.icon}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Recent Jobs */}
//         <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl overflow-hidden">
//           <div className="px-8 py-6 bg-gradient-to-r from-gray-50/50 to-blue-50/30 border-b border-gray-100/50">
//             <div className="flex items-center justify-between">
//               <h2 className="text-2xl font-bold text-gray-900">Recent Jobs</h2>
//               <Link
//                 to="/employer/jobs"
//                 className="group text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all duration-200"
//               >
//                 View All
//                 <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
//               </Link>
//             </div>
//           </div>
          
//           <div className="divide-y divide-gray-100/50">
//             {recentJobs.length === 0 ? (
//               <div className="px-8 py-12 text-center">
//                 <div className="text-6xl text-gray-300 mb-6">📋</div>
//                 <h3 className="text-xl font-bold text-gray-900 mb-3">No jobs posted yet</h3>
//                 <p className="text-gray-600 mb-6 max-w-md mx-auto">Start by posting your first job to attract candidates</p>
//                 <Link
//                   to="/employer/post-job"
//                   className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold shadow-xl shadow-blue-200/50 hover:shadow-blue-300/70 transform hover:scale-105 transition-all duration-300"
//                 >
//                   Post Your First Job
//                 </Link>
//               </div>
//             ) : (
//               recentJobs.map((job) => (
//                 <div 
//                   key={job._id} 
//                   className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-300 group"
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex-1">
//                       <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200 mb-1">
//                         {job.title}
//                       </h3>
//                       <p className="text-sm text-gray-600 mb-3">{job.company} • {job.location}</p>
//                       <div className="flex items-center gap-4">
//                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
//                           job.status === 'active' 
//                             ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
//                             : job.status === 'paused' 
//                             ? 'bg-amber-100 text-amber-800 border border-amber-200' 
//                             : 'bg-red-100 text-red-800 border border-red-200'
//                         }`}>
//                           {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
//                         </span>
//                         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
//                           {job.applicationsCount} applications
//                         </span>
//                         <span className="text-xs text-gray-500">
//                           Posted {new Date(job.createdAt).toLocaleDateString()}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <Link
//                         to={`/employer/jobs/${job._id}/edit`}
//                         className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-all duration-200 font-medium"
//                       >
//                         Edit
//                       </Link>
//                       <Link
//                         to={`/jobs/${job._id}`}
//                         className="px-4 py-2 text-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-xl hover:from-blue-200 hover:to-blue-300 hover:text-blue-900 transition-all duration-200 font-medium"
//                       >
//                         View
//                       </Link>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getJobStats, getEmployerJobs, updateJobStatus } from "../../api/jobApi";
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

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, newStatus);
      
      // Update the local state to reflect the status change
      setRecentJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId ? { ...job, status: newStatus } : job
        )
      );
      
      // Update the stats
      const statsData = await getJobStats();
      setStats(statsData);
      
    } catch (error) {
      console.error("Failed to update job status:", error);
      alert("Failed to update job status. Please try again.");
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-20 h-20 border-4 border-transparent border-t-indigo-500 border-r-cyan-400 rounded-full animate-spin shadow-lg"></div>
          {/* Inner ring */}
          <div className="absolute top-3 left-3 w-14 h-14 border-3 border-transparent border-t-purple-400 border-l-pink-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.2s'}}></div>
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      color: "from-blue-600 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      icon: "💼",
      trend: "+12%",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      color: "from-emerald-500 to-teal-600",
      bgColor: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      icon: "🚀",
      trend: "+8%",
    },
    {
      title: "Applications",
      value: stats.totalApplications,
      color: "from-violet-500 to-purple-600",
      bgColor: "from-violet-50 to-purple-50",
      borderColor: "border-violet-200",
      textColor: "text-violet-700",
      icon: "📊",
      trend: "+23%",
    },
    {
      title: "Paused Jobs",
      value: stats.pausedJobs,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      icon: "⏸️",
      trend: "-5%",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/95 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  HireMe
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                <span className="text-gray-700 font-semibold text-lg">Employer Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Welcome back</p>
                  <p className="font-bold text-gray-800">{user?.fullName}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {user?.fullName?.charAt(0)}
                </div>
              </div>
              <button className="group px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <span className="flex items-center gap-2">
                  Logout
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 leading-tight">
            Welcome back,<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {user?.fullName}!
            </span>
          </h1>
          <p className="text-xl text-gray-600 font-medium">Manage your job postings and track applications with ease</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            to="/employer/post-job"
            className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white p-8 rounded-3xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-500 shadow-2xl shadow-blue-500/25 hover:shadow-blue-600/40 transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-500">💼</div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <span className="text-3xl">➕</span>
              </div>
              <h3 className="font-black text-2xl mb-3">Post New Job</h3>
              <p className="text-blue-100 font-medium">Create a new job posting to find the perfect candidate</p>
            </div>
          </Link>

          <Link
            to="/employer/profile"
            className="group relative bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white p-8 rounded-3xl hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 transition-all duration-500 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-600/40 transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-500">🏢</div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <span className="text-3xl">👤</span>
              </div>
              <h3 className="font-black text-2xl mb-3">Complete Profile</h3>
              <p className="text-emerald-100 font-medium">Update your company profile and attract top talent</p>
            </div>
          </Link>

          <Link
            to="/employer/jobs"
            className="group relative bg-gradient-to-br from-violet-500 via-purple-600 to-pink-600 text-white p-8 rounded-3xl hover:from-violet-600 hover:via-purple-700 hover:to-pink-700 transition-all duration-500 shadow-2xl shadow-purple-500/25 hover:shadow-purple-600/40 transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-500">📋</div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="font-black text-2xl mb-3">Manage Jobs</h3>
              <p className="text-violet-100 font-medium">View, edit, and manage all your job postings</p>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`group relative bg-white/90 backdrop-blur-xl p-8 rounded-3xl border ${stat.borderColor} hover:bg-white transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500`}></div>
              <div className="absolute top-4 right-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                {stat.icon}
              </div>
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    {stat.icon}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${stat.textColor} ${stat.bgColor.replace('from-', 'bg-').replace(' to-' + stat.bgColor.split(' to-')[1], '')}`}>
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{stat.title}</p>
                  <p className="text-4xl font-black text-gray-900 group-hover:scale-110 transition-transform duration-300">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
          <div className="px-8 py-8 bg-gradient-to-r from-gray-50/80 via-blue-50/50 to-purple-50/50 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Recent Jobs</h2>
                <p className="text-gray-600 font-medium">Manage and track your latest job postings</p>
              </div>
              <Link
                to="/employer/jobs"
                className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                View All Jobs
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100/50">
            {recentJobs.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <span className="text-6xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to hire amazing talent?</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">Start by posting your first job and connect with qualified candidates worldwide</p>
                <Link
                  to="/employer/post-job"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="text-2xl">✨</span>
                  Post Your First Job
                </Link>
              </div>
            ) : (
              recentJobs.map((job, index) => (
                <div 
                  key={job._id} 
                  className="group px-8 py-8 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {job.title?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-200 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 font-medium mb-2">{job.company} • {job.location}</p>
                          <p className="text-sm text-gray-500">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${
                          job.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : job.status === 'paused' 
                            ? 'bg-orange-50 text-orange-700 border-orange-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {job.status === 'active' ? '🚀 Active' : job.status === 'paused' ? '⏸️ Paused' : '🔒 Closed'}
                        </span>
                        <span className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold border border-blue-200">
                          <span className="text-lg">📊</span>
                          {job.applicationsCount} applications
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <button 
                          onClick={() => handleStatusChange(job._id, job.status === 'active' ? 'paused' : 'active')}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            job.status === 'active' 
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {job.status === 'active' ? '⏸ Pause' : '▶ Activate'}
                        </button>
                      </div>
                      <Link
                        to={`/employer/jobs/${job._id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 font-semibold border border-gray-200 hover:border-gray-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <Link
                        to={`/jobs/${job._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 hover:text-blue-900 transition-all duration-300 font-semibold border border-blue-200 hover:border-blue-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
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