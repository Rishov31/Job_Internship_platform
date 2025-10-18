import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllInternships } from "../../api/internshipApi";

export default function InternshipList(){
  const [internships, setInternships] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    try {
      setLoading(true);
      const data = await getAllInternships({ includeScraped: 'true' });
      setInternships(data.internships || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Error loading internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadge = (internship) => {
    if (internship.isScraped) {
      const sourceColors = {
        'internshala': 'bg-orange-100 text-orange-800',
        'unstop': 'bg-blue-100 text-blue-800'
      };
      return (
        <span className={`text-xs px-2 py-1 rounded-full ${sourceColors[internship.source] || 'bg-gray-100 text-gray-800'}`}>
          {internship.source}
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
        Our Platform
      </span>
    );
  };

  const getStipendDisplay = (internship) => {
    if (internship.stipend) {
      return internship.stipend;
    }
    return 'Stipend not specified';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading internships...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Browse Internships</h1>
          <p className="text-sm text-gray-600 mt-1">
            {pagination.totalInternships} internships available 
            {pagination.regularInternships > 0 && ` (${pagination.regularInternships} from our platform)`}
            {pagination.scrapedInternships > 0 && ` (${pagination.scrapedInternships} from external sources)`}
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
        {internships.filter(i => {
          const q = search.toLowerCase();
          return !q || `${i.title} ${i.company} ${i.location}`.toLowerCase().includes(q);
        }).map(i => (
          <div key={i._id} className="bg-white border rounded p-5 hover:shadow cursor-pointer" onClick={() => navigate(`/jobseeker/internships/${i._id}`)}>
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-lg">{i.title}</div>
              {getSourceBadge(i)}
            </div>
            <div className="text-sm text-gray-600">{i.company} · {i.location}</div>
            <div className="text-sm text-gray-500 mt-1">
              {getStipendDisplay(i)} · {i.duration}
            </div>
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{i.description}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {(i.skills || []).slice(0, 4).map((s, idx) => (
                <span key={idx} className="text-xs px-2 py-1 rounded bg-gray-100">{s}</span>
              ))}
            </div>
            {i.isScraped && (
              <div className="mt-3 text-xs text-gray-500">
                <a 
                  href={i.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View on {i.source}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {internships.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No internships found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
}
