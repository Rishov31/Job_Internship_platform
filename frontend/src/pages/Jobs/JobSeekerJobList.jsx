import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllJobs, saveJob, unsaveJob, checkSavedJobs } from "../../api/jobApi";
import SearchableDropdown from "../../components/SearchableDropdown";

export default function JobSeekerJobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [savedJobs, setSavedJobs] = useState([]);
  const [viewer, setViewer] = useState({ name: "User", title: "" });
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
    sortOrder: "desc",
  });

  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u.fullName) {
        setViewer((v) => ({ ...v, name: u.fullName }));
      }
    } catch {
      /* ignore */
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const name = d.fullName || d.user?.fullName;
        if (name) setViewer((v) => ({ ...v, name }));
      })
      .catch(() => {});
  }, []);

  const profileOptions = [
    ".NET Development",
    "3D Printing",
    "AI Agent Development",
    "ASP.NET Development",
    "Accounts",
    "Acting",
    "Aerospace Engineering",
    "Agriculture & Food Engineering",
    "Android App Development",
    "Angular.js",
    "Animation",
    "Anthropology",
    "Applied Sciences",
    "Architecture",
    "Artificial Intelligence",
    "Arts",
    "Backend Development",
    "Banking",
    "Big Data",
    "Bioinformatics",
    "Biotechnology",
    "Blockchain",
    "Blogging",
    "Brand Management",
    "Business Analytics",
    "Business Development",
    "C Programming",
    "C++ Programming",
    "CAD Design",
    "Chemical Engineering",
    "Chemistry",
    "Civil Engineering",
    "Cloud Computing",
    "Computer Science",
    "Content Writing",
    "Copywriting",
    "Corporate Law",
    "Customer Service",
    "Cybersecurity",
    "Data Analytics",
    "Data Science",
    "Database Management",
    "Deep Learning",
    "Digital Marketing",
    "E-commerce",
    "Economics",
    "Electrical Engineering",
    "Electronics",
    "Embedded Systems",
    "English Proficiency",
    "Event Management",
    "Fashion Design",
    "Finance",
    "Financial Modeling",
    "Flutter Development",
    "Frontend Development",
    "Full Stack Development",
    "Game Development",
    "Graphic Design",
    "HR Management",
    "Human Resources",
    "Industrial Design",
    "Information Technology",
    "Interior Design",
    "Investment Banking",
    "iOS App Development",
    "Java Development",
    "JavaScript",
    "Journalism",
    "Law",
    "Machine Learning",
    "Marketing",
    "Mechanical Engineering",
    "Media & Communication",
    "Mobile App Development",
    "Music",
    "Network Administration",
    "Node.js Development",
    "Operations",
    "Photography",
    "PHP Development",
    "Product Design",
    "Product Management",
    "Project Management",
    "Python Development",
    "Quality Assurance",
    "React.js Development",
    "Research",
    "Sales",
    "Search Engine Optimization (SEO)",
    "Social Media Marketing",
    "Software Development",
    "Software Testing",
    "Statistics",
    "Supply Chain Management",
    "System Administration",
    "Teaching",
    "UI/UX Design",
    "Video Editing",
    "Web Development",
    "Web Design",
    "WordPress Development",
  ];

  const locationOptions = [
    "Ahmedabad",
    "Bangalore",
    "Bhopal",
    "Chandigarh",
    "Chennai",
    "Coimbatore",
    "Delhi",
    "Faridabad",
    "Ghaziabad",
    "Gurgaon",
    "Guwahati",
    "Hyderabad",
    "Indore",
    "Jaipur",
    "Kanpur",
    "Kochi",
    "Kolkata",
    "Lucknow",
    "Ludhiana",
    "Mumbai",
    "Nagpur",
    "Noida",
    "Patna",
    "Pune",
    "Raipur",
    "Rajkot",
    "Ranchi",
    "Surat",
    "Thane",
    "Vadodara",
    "Visakhapatnam",
    "Agra",
    "Allahabad",
    "Amritsar",
    "Aurangabad",
    "Bareilly",
    "Belgaum",
    "Bhubaneswar",
    "Bikaner",
    "Bilaspur",
    "Bokaro",
    "Calicut",
    "Dehradun",
    "Dhanbad",
    "Durgapur",
    "Gandhinagar",
    "Gaya",
    "Gorakhpur",
    "Guntur",
    "Hubli",
    "Jabalpur",
    "Jalandhar",
    "Jamshedpur",
    "Jodhpur",
    "Kakinada",
    "Karnal",
    "Kolhapur",
    "Kota",
    "Kottayam",
    "Kozhikode",
    "Madurai",
    "Mangalore",
    "Meerut",
    "Moradabad",
    "Mysore",
    "Nashik",
    "Nellore",
    "Panaji",
    "Pondicherry",
    "Puri",
    "Raipur",
    "Rajahmundry",
    "Salem",
    "Sangli",
    "Shimla",
    "Siliguri",
    "Srinagar",
    "Thiruvananthapuram",
    "Tiruchirappalli",
    "Tirunelveli",
    "Udaipur",
    "Varanasi",
    "Vellore",
    "Vijayawada",
    "Warangal",
  ];

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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
  }, [
    filters.search,
    filters.profile,
    filters.location,
    filters.salaryLakhs,
    filters.experienceYears,
    filters.workFromHome,
    filters.jobsInMyCity,
    filters.partTime,
    filters.page,
  ]);

  useEffect(() => {
    if (jobs.length > 0) {
      checkSavedJobStatus();
    }
  }, [jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = {
        includeScraped: "true",
        limit: 20,
        page: filters.page || 1,
      };

      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.profile) {
        params.profile = filters.profile;
      }
      if (filters.location) {
        params.location = filters.location;
      }
      if (filters.salaryLakhs && filters.salaryLakhs > 0) {
        params.salaryLakhs = filters.salaryLakhs;
      }
      if (filters.experienceYears) {
        params.experience = filters.experienceYears;
      }
      if (filters.workFromHome) {
        params.isRemote = "true";
      }
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
        params.sortOrder = filters.sortOrder || "desc";
      }

      const data = await getAllJobs(params);

      setJobs(data.jobs || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSavedJobStatus = async () => {
    try {
      const regularJobIds = jobs.filter((job) => !job.isScraped).map((job) => job._id);
      const scrapedJobIds = jobs.filter((job) => job.isScraped).map((job) => job._id);

      const [regularSaved, scrapedSaved] = await Promise.all([
        regularJobIds.length > 0 ? checkSavedJobs(regularJobIds, false) : { savedJobs: [] },
        scrapedJobIds.length > 0 ? checkSavedJobs(scrapedJobIds, true) : { savedJobs: [] },
      ]);

      setSavedJobs([...regularSaved.savedJobs, ...scrapedSaved.savedJobs]);
    } catch (error) {
      console.error("Error checking saved jobs:", error);
    }
  };

  const handleSaveJob = async (jobId, isScraped) => {
    try {
      if (savedJobs.includes(jobId)) {
        await unsaveJob(jobId, isScraped);
        setSavedJobs((prev) => prev.filter((id) => id !== jobId));
      } else {
        await saveJob(jobId, isScraped);
        setSavedJobs((prev) => [...prev, jobId]);
      }
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleProfileSelect = (profile) => {
    updateFilter("profile", profile);
  };

  const handleLocationSelect = (location) => {
    updateFilter("location", location);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    } catch {
      /* ignore */
    }
    navigate("/login");
  };

  const getSalaryDisplay = (job) => {
    if (job.salary?.text) {
      return job.salary.text;
    }
    if (job.salary?.min && job.salary?.max) {
      return `$${job.salary.min}-${job.salary.max}`;
    }
    return "Salary not specified";
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diffInDays = Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getCompanyLogo = (company) => {
    const logos = {
      Google: "https://logo.clearbit.com/google.com",
      Spotify: "https://logo.clearbit.com/spotify.com",
      Airbnb: "https://logo.clearbit.com/airbnb.com",
      Microsoft: "https://logo.clearbit.com/microsoft.com",
      Apple: "https://logo.clearbit.com/apple.com",
    };

    return (
      logos[company] ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=0f172a&color=38bdf8`
    );
  };

  const card =
    "rounded-2xl border border-slate-700/70 bg-slate-900/60 shadow-xl backdrop-blur";
  const inputBase =
    "w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050818] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_50%)]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
          <div className="mt-4 text-lg text-slate-400">Loading jobs…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050818] text-slate-100 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),transparent_50%)]">
      {/* Top Navigation */}
      <div className="border-b border-slate-800/80 bg-[#050818]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <Link to="/student/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600">
                <span className="text-sm font-bold text-white">H</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-50">
                Hire<span className="text-sky-400">Me</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                to="/jobseeker/dashboard"
                className="text-slate-400 transition hover:text-slate-200"
              >
                Portfolio
              </Link>
              <Link
                to="/jobseeker/jobs"
                className="border-b-2 border-sky-400 pb-1 font-medium text-sky-300"
              >
                Jobs
              </Link>
            </nav>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-slate-400 transition hover:text-slate-200"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Filters */}
          <div className="lg:col-span-3">
            <div className={`p-6 ${card}`}>
              <h3 className="mb-6 text-lg font-semibold text-slate-50">Filters</h3>

              <div className="mb-4">
                <SearchableDropdown
                  label="Profile"
                  options={profileOptions}
                  value={filters.profile}
                  onSelect={handleProfileSelect}
                  placeholder="e.g. Marketing"
                  variant="dark"
                />
              </div>

              <div className="mb-4">
                <SearchableDropdown
                  label="Location"
                  options={locationOptions}
                  value={filters.location}
                  onSelect={handleLocationSelect}
                  placeholder="e.g. Delhi"
                  variant="dark"
                />
              </div>

              <div className="mb-4">
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={filters.jobsInMyCity}
                      onChange={(e) => updateFilter("jobsInMyCity", e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500/40"
                    />
                    <span className="ml-2 text-sm text-slate-300">Jobs in my city</span>
                  </label>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={filters.workFromHome}
                      onChange={(e) => updateFilter("workFromHome", e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500/40"
                    />
                    <span className="ml-2 text-sm text-slate-300">Work from home</span>
                  </label>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={filters.partTime}
                      onChange={(e) => updateFilter("partTime", e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500/40"
                    />
                    <span className="ml-2 text-sm text-slate-300">Part-time</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Annual salary (in lakhs)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={filters.salaryLakhs || 0}
                    onChange={(e) => updateFilter("salaryLakhs", parseInt(e.target.value, 10))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-sky-500"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>0</span>
                    <span>2</span>
                    <span>4</span>
                    <span>6</span>
                    <span>8</span>
                    <span>10</span>
                  </div>
                  {filters.salaryLakhs > 0 && (
                    <div className="mt-2 text-center">
                      <span className="text-sm font-medium text-sky-400">
                        {filters.salaryLakhs} LPA
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Years of experience
                </label>
                <select
                  value={filters.experienceYears}
                  onChange={(e) => updateFilter("experienceYears", e.target.value)}
                  className={inputBase}
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

              <div className="mb-4">
                <button
                  type="button"
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
                      sortOrder: "desc",
                    });
                  }}
                  className="text-sm font-medium text-sky-400 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-300"
                >
                  Clear all
                </button>
              </div>

              <div className="mb-4 text-center">
                <span className="text-sm text-slate-500">OR</span>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-400">Search</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        loadJobs();
                      }
                    }}
                    placeholder="e.g. Design, Mumbai, Infosys"
                    className={inputBase}
                  />
                  <button
                    type="button"
                    onClick={loadJobs}
                    className="flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-white shadow-lg shadow-sky-900/30 transition hover:from-sky-500 hover:to-indigo-500"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-6">
            {jobs.length > 0 && (
              <div className={`mb-6 p-6 ${card}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-50">Popular</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {jobs.slice(0, Math.min(4, jobs.length)).map((job) => (
                    <div
                      key={job._id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") navigate(`/jobseeker/jobs/${job._id}`);
                      }}
                      className="cursor-pointer rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 transition hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-900/20"
                      onClick={() => navigate(`/jobseeker/jobs/${job._id}`)}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <img
                          src={getCompanyLogo(job.company)}
                          alt={job.company}
                          className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-600"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveJob(job._id, job.isScraped);
                          }}
                          className="rounded p-1 hover:bg-slate-800"
                        >
                          <svg
                            className={`h-5 w-5 ${savedJobs.includes(job._id) ? "fill-current text-sky-400" : "text-slate-500"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                        </button>
                      </div>
                      <h3 className="mb-1 text-sm font-medium text-slate-100">{job.title}</h3>
                      <div className="mb-2 flex items-center gap-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className="h-3 w-3 text-amber-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
                          {job.rating?.toFixed(1) || "4.5"}
                        </span>
                      </div>
                      <p className="mb-2 text-xs text-slate-400">{job.location}</p>
                      <p className="text-xs text-slate-500">
                        Applied {Math.floor(Math.random() * 30) + 1} days ago
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`p-6 ${card}`}>
              <h2 className="mb-4 text-lg font-semibold text-slate-50">Now Hiring</h2>
              {jobs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-lg text-slate-500">No jobs found. Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/jobseeker/jobs/${job._id}`);
                        }}
                        className="cursor-pointer rounded-xl border border-slate-700/80 bg-slate-900/40 p-6 transition hover:border-sky-500/25 hover:shadow-lg"
                        onClick={() => navigate(`/jobseeker/jobs/${job._id}`)}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={getCompanyLogo(job.company)}
                              alt={job.company}
                              className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-600"
                            />
                            <div>
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-50">
                                  {job.title || job.company}
                                </h3>
                                {job.isUrgent && (
                                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200 ring-1 ring-amber-500/40">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span>{getTimeAgo(job.createdAt || job.lastScraped)}</span>
                                <span>Full Time</span>
                                <span>3-12 month</span>
                                <span>
                                  {job.applicationsCount || Math.floor(Math.random() * 50) + 1}{" "}
                                  Applied
                                </span>
                                <span className="text-sky-400/90">{getSalaryDisplay(job)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveJob(job._id, job.isScraped);
                            }}
                            className="rounded-lg p-2 hover:bg-slate-800"
                          >
                            <svg
                              className={`h-5 w-5 ${savedJobs.includes(job._id) ? "fill-current text-sky-400" : "text-slate-500"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                              />
                            </svg>
                          </button>
                        </div>

                        <p className="mb-4 line-clamp-3 text-slate-400">
                          {job.description?.substring(0, 150)}...
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className="h-4 w-4 text-amber-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-slate-500">{job.location}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(job.skills || []).slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300 ring-1 ring-slate-600/80"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pagination.total > 1 && (
                    <div className="mt-6 border-t border-slate-700/80 pt-6">
                      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="text-sm text-slate-500">
                          Showing {(pagination.current - 1) * 20 + 1} to{" "}
                          {Math.min(pagination.current * 20, pagination.totalJobs)} of{" "}
                          {pagination.totalJobs} jobs
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePageChange(pagination.current - 1)}
                            disabled={pagination.current === 1}
                            className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <div className="flex flex-wrap items-center gap-1">
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
                                  type="button"
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                                    pagination.current === pageNum
                                      ? "border-sky-500 bg-sky-600 text-white"
                                      : "border-slate-600 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePageChange(pagination.current + 1)}
                            disabled={pagination.current === pagination.total}
                            className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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

          {/* Right */}
          <div className="lg:col-span-3">
            <div className={`mb-6 p-6 ${card}`}>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-600">
                  <svg
                    className="h-8 w-8 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-slate-50">{viewer.name}</h3>
                <p className="mb-4 text-sm text-slate-500">
                  {viewer.title || "Job seeker"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-sky-600/90 via-indigo-700/90 to-violet-900/90 p-6 text-white shadow-xl shadow-indigo-950/50">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/20 backdrop-blur">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Premium Account</h3>
                <p className="mb-4 text-sm text-sky-100/90">Find jobs faster with HireMe Pro</p>
                <button
                  type="button"
                  className="w-full rounded-xl bg-white py-2.5 font-semibold text-indigo-700 shadow-lg transition hover:bg-slate-100"
                >
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
