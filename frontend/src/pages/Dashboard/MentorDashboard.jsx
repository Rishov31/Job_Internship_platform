import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyMentorProfile, upsertMyMentorProfile, getMyMentoringSessionsAsMentor, getMyChatRooms } from "../../api/mentorApi";
import NotificationBell from "../../components/NotificationBell";

export default function MentorDashboard() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ 
    title: "", 
    experienceYears: 0, 
    expertise: [], 
    bio: "", 
    pricePerMinute: 0, 
    timezone: "UTC", 
    availability: [],
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [userName, setUserName] = useState("User");
  const [activeTab, setActiveTab] = useState("profile"); // profile, sessions
  const [profileCompletion, setProfileCompletion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // Get user info
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>r.json()).then(data=>{
        if (data.user?.fullName) setUserName(data.user.fullName);
      }).catch(()=>{});

    // Get profile
    getMyMentorProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          title: p.title || "",
          experienceYears: p.experienceYears || 0,
          expertise: p.expertise || [],
          bio: p.bio || "",
          pricePerMinute: p.pricePerMinute || 0,
          timezone: p.timezone || "UTC",
          availability: p.availability || [],
          isActive: p.isActive !== false,
        });
        calculateProfileCompletion(p);
      })
      .catch(() => setProfile(null));

    // Get sessions
    getMyMentoringSessionsAsMentor()
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]));

    // Get chat rooms
    getMyChatRooms()
      .then((data) => setChatRooms(data.chatRooms || []))
      .catch(() => setChatRooms([]));
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    } catch (e) {
      // ignore
    }
    navigate("/login");
  };

  const calculateProfileCompletion = (p) => {
    let completed = 0;
    const total = 7;
    if (p?.title) completed++;
    if (p?.experienceYears > 0) completed++;
    if (p?.expertise?.length > 0) completed++;
    if (p?.bio) completed++;
    if (p?.pricePerMinute > 0) completed++;
    if (p?.timezone) completed++;
    if (p?.availability?.length > 0) completed++;
    setProfileCompletion(Math.round((completed / total) * 100));
  };

  const updateField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: type === "checkbox" ? checked : (name === "experienceYears" || name === "pricePerMinute" ? Number(value) : value) 
    }));
  };

  const updateExpertise = (value) => setForm((f) => ({ ...f, expertise: value.split(",").map((s) => s.trim()).filter(Boolean) }));

  const addSlot = () => setForm((f) => ({ ...f, availability: [...(f.availability || []), { dayOfWeek: "mon", startTime: "09:00", endTime: "10:00" }] }));
  const updateSlot = (idx, key, value) => setForm((f) => ({ ...f, availability: f.availability.map((s, i) => (i === idx ? { ...s, [key]: value } : s)) }));
  const removeSlot = (idx) => setForm((f) => ({ ...f, availability: f.availability.filter((_, i) => i !== idx) }));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await upsertMyMentorProfile(form);
      setProfile(saved);
      calculateProfileCompletion(saved);
      alert("Profile saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Hirefly.</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/mentor/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/mentor/chat" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Chat</span>
          </Link>
          <Link to="/mentor/video-call" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span>Video Call</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <div className="text-xs text-gray-400 uppercase mb-3">Settings</div>
          <Link to="/mentor/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
              <path d="M16.24 7.76l-2.12 2.12m-4.24 4.24l-2.12 2.12m4.24-8.48l2.12 2.12m-8.48 4.24l2.12 2.12"/>
            </svg>
            <span>Settings</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
              <p className="text-gray-500 text-sm">Manage your mentoring profile and sessions</p>
            </div>
          </div>

          {/* Profile Completion Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm mb-2">Profile Completion</div>
                <div className="text-3xl font-bold mb-1">{profileCompletion}%</div>
                <div className="text-sm text-blue-100 mb-4">{profileCompletion === 100 ? "Complete" : "Incomplete"}</div>
                <div className="w-full bg-white/30 rounded-full h-2 mb-4">
                  <div className="bg-white h-2 rounded-full" style={{width: `${profileCompletion}%`}} />
                </div>
              </div>
              {profileCompletion < 100 && (
                <button 
                  onClick={() => setActiveTab("profile")}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
                >
                  Complete Profile
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 font-medium transition ${
                activeTab === "profile"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Profile & Availability
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`px-4 py-2 font-medium transition ${
                activeTab === "sessions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              My Sessions ({sessions.length})
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Mentor Profile & Availability</h2>
              <form onSubmit={onSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title/Position *</label>
                    <input 
                      name="title" 
                      value={form.title} 
                      onChange={updateField} 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Senior Frontend Engineer" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
                    <input 
                      name="experienceYears" 
                      type="number" 
                      min="0" 
                      value={form.experienceYears} 
                      onChange={updateField} 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per minute (₹) *</label>
                    <input 
                      name="pricePerMinute" 
                      type="number" 
                      min="0" 
                      value={form.pricePerMinute} 
                      onChange={updateField} 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone *</label>
                    <input 
                      name="timezone" 
                      value={form.timezone} 
                      onChange={updateField} 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Asia/Kolkata" 
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expertise/Domain (comma separated) *</label>
                  <input 
                    value={form.expertise.join(", ")} 
                    onChange={(e)=>updateExpertise(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="React, System Design, Resume Review, Career Guidance" 
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple domains with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio/Description *</label>
                  <textarea 
                    name="bio" 
                    value={form.bio} 
                    onChange={updateField} 
                    rows={4} 
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Tell mentees about your experience and how you can help them..."
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Availability Slots *</label>
                    <button 
                      type="button" 
                      onClick={addSlot} 
                      className="text-blue-600 text-sm font-medium hover:text-blue-700"
                    >
                      + Add Slot
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(form.availability||[]).map((s, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                        <select 
                          value={s.dayOfWeek} 
                          onChange={(e)=>updateSlot(idx, "dayOfWeek", e.target.value)} 
                          className="col-span-3 border rounded-lg px-2 py-2"
                        >
                          {['sun','mon','tue','wed','thu','fri','sat'].map(d=> 
                            <option key={d} value={d}>{d.toUpperCase()}</option>
                          )}
                        </select>
                        <input 
                          type="time" 
                          value={s.startTime} 
                          onChange={(e)=>updateSlot(idx, "startTime", e.target.value)} 
                          className="col-span-3 border rounded-lg px-2 py-2" 
                        />
                        <input 
                          type="time" 
                          value={s.endTime} 
                          onChange={(e)=>updateSlot(idx, "endTime", e.target.value)} 
                          className="col-span-3 border rounded-lg px-2 py-2" 
                        />
                        <button 
                          type="button" 
                          onClick={()=>removeSlot(idx)} 
                          className="col-span-3 text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {(!form.availability || form.availability.length === 0) && (
                      <p className="text-sm text-gray-500">No availability slots added. Click "Add Slot" to add your available times.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={updateField}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Make my profile active (visible to jobseekers)</label>
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
                <div className="flex justify-end">
                  <button 
                    disabled={saving} 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                  <div className="text-gray-500 mb-2">No mentoring sessions yet.</div>
                  <div className="text-sm text-gray-400">Sessions will appear here once jobseekers book with you.</div>
                </div>
              ) : (
                sessions.map((session) => (
                  <div key={session._id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            {session.jobseeker?.avatarUrl ? (
                              <img src={session.jobseeker.avatarUrl} alt={session.jobseeker.fullName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {session.jobseeker?.fullName?.charAt(0)?.toUpperCase() || "J"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{session.jobseeker?.fullName || "Jobseeker"}</div>
                            <div className="text-sm text-gray-500">{session.jobseeker?.email || ""}</div>
                          </div>
                        </div>
                        <div className="ml-15 space-y-1">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Session Date:</span> {formatTime(session.startTime)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Duration:</span> {session.minutes} minutes
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Amount:</span> ₹{session.totalAmount}
                          </div>
                          {session.motivation && (
                            <div className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Motivation:</span> {session.motivation}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === "paid" ? "bg-green-100 text-green-700" :
                          session.status === "pending_payment" ? "bg-yellow-100 text-yellow-700" :
                          session.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                          session.status === "completed" ? "bg-gray-100 text-gray-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {session.status.replace("_", " ").toUpperCase()}
                        </span>
                        {session.status === "paid" && (
                          <Link 
                            to={`/mentor/chat?room=${session._id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm text-center"
                          >
                            Chat
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
