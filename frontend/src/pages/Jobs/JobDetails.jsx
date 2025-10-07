import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getJobById } from "../../api/jobApi";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await getJobById(id);
        setJob(data);
      } catch (err) {
        console.error("Failed to load job details", err);
        setError("Failed to load job details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow border">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Link to="/" className="text-sky-600 hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sky-600 font-extrabold text-xl">HireMe</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-700 font-medium">Job Details</span>
          </div>
          <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">Home</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600">{job.company} • {job.location}</p>
            </div>
            <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{job.jobType}</span>
          </div>

          <div className="space-y-6">
            {job.salary && (job.salary.min || job.salary.max) && (
              <p className="text-gray-700"><strong>Salary:</strong> {job.salary.currency || "INR"} {job.salary.min || "-"} - {job.salary.max || "-"}/{job.salary.period || "monthly"}</p>
            )}
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s, i) => (
                    <span key={i} className="px-3 py-1 text-sm rounded-full bg-sky-100 text-sky-800">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(job.requirements) && job.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {job.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
