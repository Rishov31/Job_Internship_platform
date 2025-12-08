import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyApplications } from "../../api/applicationApi";

export default function JobSeekerApplications(){
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0, interview: 0, accepted: 0, rejected: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getMyApplications();
      setApps(data.applications || []);
      
      // Calculate stats
      const applications = data.applications || [];
      setStats({
        total: applications.length,
        pending: applications.filter(a => a.status === "pending").length,
        shortlisted: applications.filter(a => a.status === "shortlisted").length,
        interview: applications.filter(a => a.status === "interview").length,
        accepted: applications.filter(a => a.status === "accepted").length,
        rejected: applications.filter(a => a.status === "rejected").length,
      });
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'shortlisted': return 'bg-green-100 text-green-700 border-green-200';
      case 'interview': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-500 text-sm mt-1">Track all your job applications</p>
            </div>
            <Link 
              to="/jobseeker/jobs" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Find More Jobs
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
            <div className="text-sm text-yellow-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
            <div className="text-sm text-green-600 mb-1">Shortlisted</div>
            <div className="text-2xl font-bold text-green-700">{stats.shortlisted}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
            <div className="text-sm text-purple-600 mb-1">Interview</div>
            <div className="text-2xl font-bold text-purple-700">{stats.interview}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
            <div className="text-sm text-blue-600 mb-1">Accepted</div>
            <div className="text-2xl font-bold text-blue-700">{stats.accepted}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
            <div className="text-sm text-red-600 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm border">
          {apps.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500 mb-6">Start applying to jobs to see them here</p>
              <Link 
                to="/jobseeker/jobs" 
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {apps.map(a => {
                const jobData = a.job || {};
                const appliedDate = formatDate(a.appliedAt);
                
                return (
                  <div 
                    key={a._id} 
                    className="p-6 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      if (jobData._id) {
                        navigate(`/jobseeker/jobs/${jobData._id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{jobData.title || 'Job Title'}</h3>
                          {a.isScraped && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              External
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {jobData.company || 'Company'} · {jobData.location || 'Location'}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {appliedDate && <span>Applied on {appliedDate}</span>}
                          {a.coverLetter && <span>Cover letter included</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full capitalize border font-medium ${getStatusColor(a.status)}`}>
                          {a.status}
                        </span>
                        {a.status === 'interview' && a.metadata?.interview && (
                          <div className="text-xs text-gray-500 text-right">
                            <div>Interview scheduled</div>
                            {a.metadata.interview.date && (
                              <div>{new Date(a.metadata.interview.date).toLocaleDateString()}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


