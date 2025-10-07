import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllResources } from "../../api/resourceApi";

export default function JobSeekerDashboard() {
  const [completion, setCompletion] = useState({ completionPercentage: 0, isProfileComplete: false });
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0, interview: 0 });
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/jobseeker/profile/completion", { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>r.json()).then(setCompletion).catch(()=>{});
    fetch("/api/jobseeker/applications?limit=20", { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>r.json()).then(d=>{
        const apps = d.applications||[]; setRecent(apps.slice(0,5));
        setStats({
          total: apps.length,
          pending: apps.filter(a=>a.status==="pending").length,
          shortlisted: apps.filter(a=>a.status==="shortlisted").length,
          interview: apps.filter(a=>a.status==="interview").length,
        });
      }).catch(()=>{});

    // Fetch a few featured/public resources for the dashboard
    getAllResources({ featured: true, limit: 3 }).then((data)=>{
      setResources(data.resources || []);
    }).catch(()=> setResources([]));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Job Seeker Dashboard</h1>
            <p className="text-gray-500 text-sm">Manage profile and applications</p>
          </div>
          <div className="flex gap-3">
            <Link to="/jobseeker/profile" className="px-4 py-2 border rounded">Profile</Link>
            <Link to="/jobseeker/jobs" className="px-4 py-2 bg-blue-600 text-white rounded">Find Jobs</Link>
            <Link to="/jobseeker/mentoring" className="px-4 py-2 border rounded">Mentoring</Link>
          </div>

          {/* Career Guidance section */}
          <div className="bg-white border rounded p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Career Guidance</h2>
              <Link to="/resources" className="text-blue-600 text-sm">View all</Link>
            </div>
            {resources.length === 0 ? (
              <div className="text-gray-500 text-sm">No resources yet. Check back soon.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((r)=> (
                  <Link key={r._id} to={`/resources/${r._id}`} className="group border rounded p-4 hover:shadow transition">
                    <div className="flex gap-3 items-start">
                      {r.thumbnailUrl ? (
                        <img src={r.thumbnailUrl} alt={r.title} className="w-20 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-20 h-14 bg-gray-100 rounded" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-gray-500">{r.type}</div>
                        <div className="font-medium text-gray-900 truncate group-hover:text-blue-600">{r.title}</div>
                        <div className="text-xs text-gray-500 truncate">{r.category?.replace('-', ' ')}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border rounded p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Profile Completion</h2>
              <span className={`text-sm ${completion.isProfileComplete?"text-green-600":"text-amber-600"}`}>
                {completion.isProfileComplete?"Complete":"Incomplete"}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div className="bg-blue-600 h-2 rounded" style={{width: `${completion.completionPercentage||0}%`}} />
            </div>
            <div className="mt-3 text-sm text-gray-600">{completion.completionPercentage||0}% complete</div>
            {!completion.isProfileComplete && (
              <Link to="/jobseeker/profile" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded">Complete Profile</Link>
            )}
          </div>

          <div className="bg-white border rounded p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent Applications</h2>
              <Link to="/jobseeker/applications" className="text-blue-600 text-sm">View all</Link>
            </div>
            {recent.length===0 ? (
              <div className="text-gray-500 text-sm">No applications yet.</div>
            ) : (
              <div className="divide-y">
                {recent.map(a=> (
                  <div key={a._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a?.job?.title}</div>
                      <div className="text-sm text-gray-500">{a?.job?.company} · {a?.job?.location}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 capitalize">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border rounded p-6">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/jobseeker/jobs" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded">Browse Jobs</Link>
              <Link to="/jobseeker/applications" className="block w-full text-center px-4 py-2 border rounded">My Applications</Link>
            </div>
          </div>
          <div className="bg-white border rounded p-6">
            <h3 className="font-semibold mb-3">Application Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded bg-gray-50">
                <div className="text-gray-500">Total</div>
                <div className="text-xl font-semibold">{stats.total}</div>
              </div>
              <div className="p-3 rounded bg-yellow-50">
                <div className="text-yellow-700">Pending</div>
                <div className="text-xl font-semibold text-yellow-700">{stats.pending}</div>
              </div>
              <div className="p-3 rounded bg-green-50">
                <div className="text-green-700">Shortlisted</div>
                <div className="text-xl font-semibold text-green-700">{stats.shortlisted}</div>
              </div>
              <div className="p-3 rounded bg-purple-50">
                <div className="text-purple-700">Interviews</div>
                <div className="text-xl font-semibold text-purple-700">{stats.interview}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


