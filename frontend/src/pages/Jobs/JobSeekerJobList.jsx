import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllJobs, saveJob, unsaveJob, checkSavedJobs } from "../../api/jobApi";

export default function JobSeekerJobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [savedJobs, setSavedJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    isRemote: false,
    isUrgent: false,
    isFullTime: true,
    experience: [],
    skills: [],
    sortBy: "date",
    sortOrder: "desc"
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, [filters]);

  useEffect(() => {
    if (jobs.length > 0) {
      checkSavedJobStatus();
    }
  }, [jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = {
        includeScraped: 'true',
        limit: 20,
        ...filters
      };
      
      // Clean up empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === "" || (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });

      const data = await getAllJobs(params);
      setJobs(data.jobs || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSavedJobStatus = async () => {
    try {
      const jobIds = jobs.map(job => job._id);
      const regularJobIds = jobs.filter(job => !job.isScraped).map(job => job._id);
      const scrapedJobIds = jobs.filter(job => job.isScraped).map(job => job._id);

      const [regularSaved, scrapedSaved] = await Promise.all([
        regularJobIds.length > 0 ? checkSavedJobs(regularJobIds, false) : { savedJobs: [] },
        scrapedJobIds.length > 0 ? checkSavedJobs(scrapedJobIds, true) : { savedJobs: [] }
      ]);

      setSavedJobs([...regularSaved.savedJobs, ...scrapedSaved.savedJobs]);
    } catch (error) {
      console.error('Error checking saved jobs:', error);
    }
  };

  const handleSaveJob = async (jobId, isScraped) => {
    try {
      if (savedJobs.includes(jobId)) {
        await unsaveJob(jobId, isScraped);
        setSavedJobs(prev => prev.filter(id => id !== jobId));
      } else {
        await saveJob(jobId, isScraped);
        setSavedJobs(prev => [...prev, jobId]);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getSalaryDisplay = (job) => {
    if (job.salary?.text) {
      return job.salary.text;
    }
    if (job.salary?.min && job.salary?.max) {
      return `$${job.salary.min}-${job.salary.max}`;
    }
    return 'Salary not specified';
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diffInDays = Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getCompanyLogo = (company) => {
    // Mock company logos - in real app, these would come from company data
    const logos = {
      'Google': 'https://logo.clearbit.com/google.com',
      'Spotify': 'https://logo.clearbit.com/spotify.com',
      'Airbnb': 'https://logo.clearbit.com/airbnb.com',
      'Microsoft': 'https://logo.clearbit.com/microsoft.com',
      'Apple': 'https://logo.clearbit.com/apple.com'
    };
    
    return logos[company] || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Carimodal</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/jobseeker/dashboard" className="text-gray-600 hover:text-gray-900">Portfolio</Link>
              <Link to="/jobseeker/jobs" className="text-blue-600 border-b-2 border-blue-600 pb-1">Job Offer</Link>
              <Link to="/jobseeker/messages" className="text-gray-600 hover:text-gray-900">Message</Link>
              <Link to="/jobseeker/community" className="text-gray-600 hover:text-gray-900">Community</Link>
              <Link to="/jobseeker/notifications" className="text-gray-600 hover:text-gray-900">Notifications</Link>
            </nav>
          </div>
          <button className="text-gray-600 hover:text-gray-900">Logout</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Filter</h3>
              
              {/* Salary Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Salary</label>
                <div className="relative">
                  <input
                    type="range"
                    min="300"
                    max="5000"
                    value={filters.salaryMax || 4600}
                    onChange={(e) => updateFilter('salaryMax', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>$300</span>
                    <span className="font-medium text-gray-900">${filters.salaryMax || 4600}</span>
                    <span>$5k</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Availability</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isUrgent}
                      onChange={(e) => updateFilter('isUrgent', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Urgent</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isRemote}
                      onChange={(e) => updateFilter('isRemote', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isFullTime}
                      onChange={(e) => updateFilter('isFullTime', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Full-Time</span>
                  </label>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">4.0</span>
                </div>
              </div>

              {/* Experience */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Experience</label>
                <div className="space-y-2">
                  {['Graphic Designer', 'UI Designer', 'UX Designer', 'Developer', 'UX Writer', 'Data Analyst', 'User Testing'].map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.experience.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('experience', [...filters.experience, role]);
                          } else {
                            updateFilter('experience', filters.experience.filter(exp => exp !== role));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            {/* Search Bar */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-4">
                <select 
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Location</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Surabaya">Surabaya</option>
                </select>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder="Search"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Popular Jobs Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Popular</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {jobs.slice(0, 4).map((job) => (
                  <div 
                    key={job._id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/jobseeker/jobs/${job._id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <img src={getCompanyLogo(job.company)} alt={job.company} className="w-10 h-10 rounded-lg object-cover" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveJob(job._id, job.isScraped);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <svg className={`w-5 h-5 ${savedJobs.includes(job._id) ? 'text-blue-600 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="font-medium text-sm mb-1">{job.title}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{job.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{job.location}</p>
                    <p className="text-xs text-gray-400">Applied {Math.floor(Math.random() * 30) + 1} days ago</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Now Hiring Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Now Hiring</h2>
              <div className="space-y-4">
                {jobs.slice(4).map((job) => (
                  <div 
                    key={job._id} 
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/jobseeker/jobs/${job._id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={getCompanyLogo(job.company)} alt={job.company} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{job.company}</h3>
                            {filters.isUrgent && (
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Urgent</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{getTimeAgo(job.createdAt || job.lastScraped)}</span>
                            <span>Full Time</span>
                            <span>3-12 month</span>
                            <span>{job.applicationsCount || Math.floor(Math.random() * 50) + 1} Applied</span>
                            <span>{getSalaryDisplay(job)}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveJob(job._id, job.isScraped);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <svg className={`w-5 h-5 ${savedJobs.includes(job._id) ? 'text-blue-600 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{job.description?.substring(0, 150)}...</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{job.location}</span>
                      </div>
                      <div className="flex gap-2">
                        {(job.skills || []).slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - User Profile */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-1">Pambayun</h3>
                <p className="text-gray-500 text-sm mb-4">UI Designer</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">28 Available Connects</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">9 Submitted Proposal</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Premium Account Promo */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Premium Account</h3>
                <p className="text-sm text-blue-100 mb-4">Make you easily find Job</p>
                <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition font-medium">
                  Goooo!
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}