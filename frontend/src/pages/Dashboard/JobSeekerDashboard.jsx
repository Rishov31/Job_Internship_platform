// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { getAllResources } from "../../api/resourceApi";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllResources } from "../../api/resourceApi";
import NotificationBell from "../../components/NotificationBell";

export default function JobSeekerDashboard() {
  const [completion, setCompletion] = useState({ completionPercentage: 0, isProfileComplete: false });
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0, interview: 0 });
  const [resources, setResources] = useState([]);
  const navigate = useNavigate();

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

    getAllResources({ featured: true, limit: 3 }).then((data)=>{
      setResources(data.resources || []);
    }).catch(()=> setResources([]));
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    } catch (e) {
      // ignore storage errors
    }
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Hirefly.</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/jobseeker/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/jobseeker/applications" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>My Application</span>
          </Link>
          <Link to="/jobseeker/messages" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Messages</span>
          </Link>
          <Link to="/jobseeker/jobs" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Job Search</span>
          </Link>
          <Link to="/jobseeker/mentoring" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span>Mentoring</span>
          </Link>
          <Link to="/jobseeker/mentor-chats" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Mentor Chats</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <div className="text-xs text-gray-400 uppercase mb-3">Settings</div>
          <Link to="/jobseeker/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
              <path d="M16.24 7.76l-2.12 2.12m-4.24 4.24l-2.12 2.12m4.24-8.48l2.12 2.12m-8.48 4.24l2.12 2.12"/>
            </svg>
            <span>Settings</span>
          </Link>
          <Link to="/jobseeker/help" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Help Support</span>
          </Link>
        </div>

        {/* Career Guidance Promo */}
        <div className="m-4 p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
          <div className="text-xs uppercase tracking-wide mb-2">Hirefly PRO</div>
          <div className="font-semibold mb-2">Get Personal Career Coach On-the-go</div>
          <p className="text-xs text-blue-100 mb-3">Get rewarded and stand out with this feature professional coach</p>
          <Link to="/resources" className="inline-flex items-center text-sm font-medium hover:underline">
            Upgrade to PRO
            <span className="ml-1">→</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search anything here..." 
              className="flex-1 outline-none text-gray-700"
            />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm">Take a look at your monthly job search application.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>This Month</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Job Applied Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Job Applied</div>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Job Applied</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}} />
                </div>
                <span className="text-xs text-gray-500">75%</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">Unfinalize</div>
              <Link to="/jobseeker/applications" className="text-blue-600 text-sm font-medium mt-3 inline-flex items-center hover:underline">
                View All Job Applied →
              </Link>
            </div>

            {/* Interviews Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Upcoming Interview</div>
                  <div className="text-3xl font-bold">{stats.interview}</div>
                  <div className="text-xs text-gray-500 mt-1">Interviewed</div>
                </div>
              </div>
              {stats.interview > 0 ? (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Today Jan 12, 2022</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">User</div>
                      <div className="text-xs text-gray-500">HR at DigitalOcean</div>
                    </div>
                    <div className="text-xs text-gray-500">10:00 - 11:00</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No upcoming interviews</div>
              )}
              <Link to="/jobseeker/applications" className="text-blue-600 text-sm font-medium mt-3 inline-flex items-center hover:underline">
                View Schedule →
              </Link>
            </div>

            {/* Profile Completion Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-sm">
              <div className="text-sm mb-2">Profile Completion</div>
              <div className="text-3xl font-bold mb-1">{completion.completionPercentage}%</div>
              <div className="text-sm text-blue-100 mb-4">{completion.isProfileComplete ? "Complete" : "Incomplete"}</div>
              <div className="w-full bg-white/30 rounded-full h-2 mb-4">
                <div className="bg-white h-2 rounded-full" style={{width: `${completion.completionPercentage||0}%`}} />
              </div>
              {!completion.isProfileComplete && (
                <Link to="/jobseeker/profile" className="inline-block px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
                  Complete Profile
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Applications History */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">Recent Applications History</h2>
                <Link to="/jobseeker/applications" className="text-blue-600 text-sm font-medium hover:underline">
                  View All Applications History →
                </Link>
              </div>
              <div className="p-6">
                {recent.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No applications yet.</div>
                ) : (
                  <div className="space-y-4">
                    {recent.map(a => (
                      <div key={a._id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{a?.job?.title}</div>
                          <div className="text-sm text-gray-500">{a?.job?.company} · {a?.job?.location}</div>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full capitalize ${
                          a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          a.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                          a.status === 'interview' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Career Guidance */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">Career Guidance</h2>
                <Link to="/resources" className="text-blue-600 text-sm font-medium hover:underline">
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {resources.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-8">No resources yet. Check back soon.</div>
                ) : (
                  <div className="space-y-3">
                    {resources.map((r) => (
                      <Link key={r._id} to={`/resources/${r._id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition group">
                        <div className="w-10 h-10 flex-shrink-0">
                          {r.thumbnailUrl ? (
                            <img src={r.thumbnailUrl} alt={r.title} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600">{r.title}</div>
                          <div className="text-xs text-gray-500">{r.category?.replace('-', ' ')} · {r.type}</div>
                          <div className="text-xs text-pink-600 mt-1">Featured</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}