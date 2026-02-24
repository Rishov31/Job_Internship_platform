import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllJobs, saveJob, unsaveJob, checkSavedJobs } from "../../api/jobApi";
import SearchableDropdown from "../../components/SearchableDropdown";

export default function JobSeekerJobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [savedJobs, setSavedJobs] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    search: "",
    profile: "",
    location: "",
    salaryLakhs: 0,
    experienceYears: "",
    jobsInMyCity: false,
    workFromHome: false,
    partTime: false,
    sortBy: "date",
    sortOrder: "desc"
  });
  
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);
  
  // Comprehensive list of profiles/categories (100+ options like Internshala)
  const profileOptions = [
    ".NET Development", "3D Printing", "AI Agent Development", "ASP.NET Development", 
    "Accounts", "Acting", "Aerospace Engineering", "Agriculture & Food Engineering",
    "Android App Development", "Angular.js", "Animation", "Anthropology", "Applied Sciences",
    "Architecture", "Artificial Intelligence", "Arts", "Backend Development", "Banking",
    "Big Data", "Bioinformatics", "Biotechnology", "Blockchain", "Blogging", "Brand Management",
    "Business Analytics", "Business Development", "C Programming", "C++ Programming", "CAD Design",
    "Chemical Engineering", "Chemistry", "Civil Engineering", "Cloud Computing", "Computer Science",
    "Content Writing", "Copywriting", "Corporate Law", "Customer Service", "Cybersecurity",
    "Data Analytics", "Data Science", "Database Management", "Deep Learning", "Digital Marketing",
    "E-commerce", "Economics", "Electrical Engineering", "Electronics", "Embedded Systems",
    "English Proficiency", "Event Management", "Fashion Design", "Finance", "Financial Modeling",
    "Flutter Development", "Frontend Development", "Full Stack Development", "Game Development",
    "Graphic Design", "HR Management", "Human Resources", "Industrial Design", "Information Technology",
    "Interior Design", "Investment Banking", "iOS App Development", "Java Development",
    "JavaScript", "Journalism", "Law", "Machine Learning", "Marketing", "Mechanical Engineering",
    "Media & Communication", "Mobile App Development", "Music", "Network Administration",
    "Node.js Development", "Operations", "Photography", "PHP Development", "Product Design",
    "Product Management", "Project Management", "Python Development", "Quality Assurance",
    "React.js Development", "Research", "Sales", "Search Engine Optimization (SEO)",
    "Social Media Marketing", "Software Development", "Software Testing", "Statistics",
    "Supply Chain Management", "System Administration", "Teaching", "UI/UX Design",
    "Video Editing", "Web Development", "Web Design", "WordPress Development"
  ];
  
  // Comprehensive list of Indian cities/locations
  const locationOptions = [
    "Ahmedabad", "Bangalore", "Bhopal", "Chandigarh", "Chennai", "Coimbatore", "Delhi",
    "Faridabad", "Ghaziabad", "Gurgaon", "Guwahati", "Hyderabad", "Indore", "Jaipur",
    "Kanpur", "Kochi", "Kolkata", "Lucknow", "Ludhiana", "Mumbai", "Nagpur", "Noida",
    "Patna", "Pune", "Raipur", "Rajkot", "Ranchi", "Surat", "Thane", "Vadodara",
    "Visakhapatnam", "Agra", "Allahabad", "Amritsar", "Aurangabad", "Bareilly", "Belgaum",
    "Bhubaneswar", "Bikaner", "Bilaspur", "Bokaro", "Calicut", "Dehradun", "Dhanbad",
    "Durgapur", "Gandhinagar", "Gaya", "Gorakhpur", "Guntur", "Hubli", "Jabalpur",
    "Jalandhar", "Jamshedpur", "Jodhpur", "Kakinada", "Karnal", "Kolhapur", "Kota",
    "Kottayam", "Kozhikode", "Madurai", "Mangalore", "Meerut", "Moradabad", "Mysore",
    "Nashik", "Nellore", "Panaji", "Pondicherry", "Puri", "Raipur", "Rajahmundry",
    "Salem", "Sangli", "Shimla", "Siliguri", "Srinagar", "Thiruvananthapuram", "Tiruchirappalli",
    "Tirunelveli", "Udaipur", "Varanasi", "Vellore", "Vijayawada", "Warangal"
  ];

  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // For search field, debounce to avoid too many API calls while typing
    // For other filters (profile, location, etc.), trigger immediately
    const shouldDebounce = filters.search && filters.search.length > 0;
    const delay = shouldDebounce ? 800 : 0;
    
    searchTimeoutRef.current = setTimeout(() => {
      loadJobs();
    }, delay);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search, filters.profile, filters.location, filters.salaryLakhs, filters.experienceYears, filters.workFromHome, filters.jobsInMyCity, filters.partTime, filters.page]);

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
        page: filters.page || 1,
      };
      
      // Add search if provided
      if (filters.search) {
        params.search = filters.search;
      }
      
      // Add profile filter
      if (filters.profile) {
        params.profile = filters.profile;
      }
      
      // Add location filter
      if (filters.location) {
        params.location = filters.location;
      }
      
      // Add salary filter (in lakhs)
      if (filters.salaryLakhs && filters.salaryLakhs > 0) {
        params.salaryLakhs = filters.salaryLakhs;
      }
      
      // Add experience filter
      if (filters.experienceYears) {
        params.experience = filters.experienceYears;
      }
      
      // Add job type filters
      if (filters.workFromHome) {
        params.isRemote = 'true';
      }
      
      if (filters.jobsInMyCity && filters.location) {
        // Jobs in my city is essentially location-based filtering
        // Already handled by location filter
      }
      
      // Add sorting
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
        params.sortOrder = filters.sortOrder || 'desc';
      }

      // Debug: Log the params being sent
      console.log('Loading jobs with params:', params);
      
      const data = await getAllJobs(params);
      console.log('Received jobs:', data.jobs?.length || 0, 'jobs');
      
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
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 when filters change
  };
  
  const handleProfileSelect = (profile) => {
    updateFilter('profile', profile);
  };
  
  const handleLocationSelect = (location) => {
    updateFilter('location', location);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hire Me</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/jobseeker/dashboard" className="text-gray-600 hover:text-gray-900">Portfolio</Link>
              <Link to="/jobseeker/jobs" className="text-blue-600 border-b-2 border-blue-600 pb-1">Jobs</Link>
              {/* <Link to="/jobseeker/messages" className="text-gray-600 hover:text-gray-900">Message</Link>
              <Link to="/jobseeker/community" className="text-gray-600 hover:text-gray-900">Community</Link>
              <Link to="/jobseeker/notifications" className="text-gray-600 hover:text-gray-900">Notifications</Link> */}
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
              <h3 className="text-lg font-semibold mb-6">Filters</h3>
              
              {/* Profile - Searchable Dropdown */}
              <div className="mb-4">
                <SearchableDropdown
                  label="Profile"
                  options={profileOptions}
                  value={filters.profile}
                  onSelect={handleProfileSelect}
                  placeholder="e.g. Marketing"
                />
              </div>

              {/* Location - Searchable Dropdown */}
              <div className="mb-4">
                <SearchableDropdown
                  label="Location"
                  options={locationOptions}
                  value={filters.location}
                  onSelect={handleLocationSelect}
                  placeholder="e.g. Delhi"
                />
              </div>

              {/* Job Type Checkboxes */}
              <div className="mb-4">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.jobsInMyCity}
                      onChange={(e) => updateFilter('jobsInMyCity', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Jobs in my city</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.workFromHome}
                      onChange={(e) => updateFilter('workFromHome', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Work from home</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.partTime}
                      onChange={(e) => updateFilter('partTime', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Part-time</span>
                  </label>
                </div>
              </div>

              {/* Annual Salary Slider */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual salary (in lakhs)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={filters.salaryLakhs || 0}
                    onChange={(e) => updateFilter('salaryLakhs', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>2</span>
                    <span>4</span>
                    <span>6</span>
                    <span>8</span>
                    <span>10</span>
                  </div>
                  {filters.salaryLakhs > 0 && (
                    <div className="text-center mt-2">
                      <span className="text-sm font-medium text-blue-600">{filters.salaryLakhs} LPA</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Years of Experience */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of experience</label>
                <select
                  value={filters.experienceYears}
                  onChange={(e) => updateFilter('experienceYears', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select years of experience</option>
                  <option value="0">0 years (Fresher)</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5">5+ years</option>
                </select>
              </div>

              {/* Clear All */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    setFilters({
                      page: 1,
                      search: "",
                      profile: "",
                      location: "",
                      salaryLakhs: 0,
                      experienceYears: "",
                      jobsInMyCity: false,
                      workFromHome: false,
                      partTime: false,
                      sortBy: "date",
                      sortOrder: "desc"
                    });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all
                </button>
              </div>

              {/* OR Separator */}
              <div className="mb-4 text-center">
                <span className="text-sm text-gray-500">OR</span>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        loadJobs();
                      }
                    }}
                    placeholder="e.g. Design, Mumbai, Infosys"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={loadJobs}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">

            {/* Popular Jobs Section */}
            {jobs.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Popular</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {jobs.slice(0, Math.min(4, jobs.length)).map((job) => (
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
            )}

            {/* Now Hiring Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Now Hiring</h2>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No jobs found. Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {jobs.map((job) => (
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
                            <h3 className="font-semibold text-lg">{job.title || job.company}</h3>
                            {job.isUrgent && (
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
                  
                  {/* Pagination Controls */}
                  {pagination.total > 1 && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing {((pagination.current - 1) * 20) + 1} to{' '}
                          {Math.min(pagination.current * 20, pagination.totalJobs)} of{' '}
                          {pagination.totalJobs} jobs
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(pagination.current - 1)}
                            disabled={pagination.current === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.total) }, (_, i) => {
                              let pageNum;
                              if (pagination.total <= 5) {
                                pageNum = i + 1;
                              } else if (pagination.current <= 3) {
                                pageNum = i + 1;
                              } else if (pagination.current >= pagination.total - 2) {
                                pageNum = pagination.total - 4 + i;
                              } else {
                                pageNum = pagination.current - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
                                    pagination.current === pageNum
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handlePageChange(pagination.current + 1)}
                            disabled={pagination.current === pagination.total}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
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
                <h3 className="font-semibold text-lg mb-1">user</h3>
                <p className="text-gray-500 text-sm mb-4">UI Designer</p>
                
                {/* <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">28 Available Connects</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">9 Submitted Proposal</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div> */}
                
                {/* <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                  Edit Profile
                </button> */}
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