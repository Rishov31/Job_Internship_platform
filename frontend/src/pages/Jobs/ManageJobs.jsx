import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEmployerJobs, updateJobStatus, deleteJob } from "../../api/jobApi";

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    status: "",
    limit: 10,
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getEmployerJobs(filters);
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, newStatus);
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error("Failed to update job status:", error);
      alert("Failed to update job status");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      try {
        await deleteJob(jobId);
        fetchJobs(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete job:", error);
        alert("Failed to delete job");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeColor = (type) => {
    switch (type) {
      case 'private': return 'bg-blue-100 text-blue-800';
      case 'government': return 'bg-green-100 text-green-800';
      case 'overseas': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-sky-600 font-extrabold text-xl">INTERNSHALA</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700 font-medium">Manage Jobs</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/employer/post-job"
                className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 text-sm"
              >
                Post New Job
              </Link>
              <Link
                to="/employer/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jobs per page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Job Postings ({pagination.totalJobs || 0})
            </h2>
          </div>

          {jobs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                {filters.status 
                  ? `No jobs found with status "${filters.status}"`
                  : "You haven't posted any jobs yet"
                }
              </p>
              <Link
                to="/employer/post-job"
                className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
              >
                Post Your First Job
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {jobs.map((job) => (
                  <div key={job._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getJobTypeColor(job.jobType)}`}>
                            {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
                          </span>
                        </div>
                        
                        <div className="text-gray-600 mb-2">
                          <p className="font-medium">{job.company} • {job.location}</p>
                          <p className="text-sm">{job.category}</p>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>📅 Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          <span>📄 {job.applicationsCount} applications</span>
                          {job.applicationDeadline && (
                            <span>⏰ Deadline {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                          )}
                          {job.isRemote && <span>🏠 Remote</span>}
                        </div>

                        {job.salary.min && (
                          <div className="mt-2 text-sm text-gray-600">
                            💰 {job.salary.currency} {job.salary.min.toLocaleString()}
                            {job.salary.max && ` - ${job.salary.max.toLocaleString()}`}
                            /{job.salary.period}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {/* Status Actions */}
                        {job.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(job._id, 'paused')}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                          >
                            Pause
                          </button>
                        )}
                        {job.status === 'paused' && (
                          <button
                            onClick={() => handleStatusChange(job._id, 'active')}
                            className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                          >
                            Activate
                          </button>
                        )}
                        {job.status !== 'closed' && (
                          <button
                            onClick={() => handleStatusChange(job._id, 'closed')}
                            className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                          >
                            Close
                          </button>
                        )}

                        {/* Edit/View Actions */}
                        <Link
                          to={`/employer/jobs/${job._id}/edit`}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/jobs/${job._id}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="px-6 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.current - 1) * filters.limit) + 1} to{' '}
                      {Math.min(pagination.current * filters.limit, pagination.totalJobs)} of{' '}
                      {pagination.totalJobs} jobs
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.current === 1}
                        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Page {pagination.current} of {pagination.total}
                      </span>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.current === pagination.total}
                        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
    </div>
  );
}
