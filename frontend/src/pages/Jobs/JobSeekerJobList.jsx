import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllJobs } from "../../api/jobApi";

export default function JobSeekerJobList(){
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getAllJobs({ includeScraped: 'true' });
      setJobs(data.jobs || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadge = (job) => {
    if (job.isScraped) {
      const sourceColors = {
        'internshala': 'bg-orange-100 text-orange-800',
        'unstop': 'bg-blue-100 text-blue-800'
      };
      return (
        <span className={`text-xs px-2 py-1 rounded-full ${sourceColors[job.source] || 'bg-gray-100 text-gray-800'}`}>
          {job.source}
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
        Our Platform
      </span>
    );
  };

  const getSalaryDisplay = (job) => {
    if (job.salary?.text) {
      return job.salary.text;
    }
    if (job.salary?.min && job.salary?.max) {
      return `${job.salary.min} - ${job.salary.max} ${job.salary.currency}`;
    }
    return 'Salary not specified';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Browse Jobs</h1>
          <p className="text-sm text-gray-600 mt-1">
            {pagination.totalJobs} jobs available 
            {pagination.regularJobs > 0 && ` (${pagination.regularJobs} from our platform)`}
            {pagination.scrapedJobs > 0 && ` (${pagination.scrapedJobs} from external sources)`}
          </p>
        </div>
        <Link to="/jobseeker/dashboard" className="text-blue-600">Dashboard</Link>
      </div>
      
      <div className="mb-6">
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search by title, company or location" 
          className="w-full border rounded px-4 py-2" 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.filter(j => {
          const q = search.toLowerCase();
          return !q || `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q);
        }).map(j => (
          <div key={j._id} className="bg-white border rounded p-5 hover:shadow cursor-pointer" onClick={() => navigate(`/jobseeker/jobs/${j._id}`)}>
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-lg">{j.title}</div>
              {getSourceBadge(j)}
            </div>
            <div className="text-sm text-gray-600">{j.company} · {j.location}</div>
            <div className="text-sm text-gray-500 mt-1">
              {getSalaryDisplay(j)}
            </div>
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{j.description}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {(j.skills || []).slice(0, 4).map((s, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-gray-100">{s}</span>
              ))}
            </div>
            {j.isScraped && (
              <div className="mt-3 text-xs text-gray-500">
                <a 
                  href={j.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View on {j.source}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {jobs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No jobs found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
}


