import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import NotificationBell from "../../components/NotificationBell";

// This dashboard is a higher-level student view.
// Job & internship search remain in the existing jobseeker module (sub‑module).

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({
    completionPercentage: 0,
    isProfileComplete: false,
  });
  const [collaborations, setCollaborations] = useState(0);
  const [contributionScore, setContributionScore] = useState(0);
  const [startupCards, setStartupCards] = useState([]);
  // Fallback user info from auth for when detailed profile is not yet created
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    storedUser = null;
  }
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const API_BASE = "/api"; // use relative API path so proxy always works

    // Load student profile basics from existing jobseeker profile
    fetch(`${API_BASE}/jobseeker/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProfile(data);
        if (data) {
          setContributionScore(data.contributionScore || 0);
        }
      })
      .catch(() => setProfile(null));

    // Completion stats
    fetch(`${API_BASE}/jobseeker/profile/completion`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setCompletion(data);
      })
      .catch(() => {});

    // Startup explorer cards
    fetch(`/api/startups/explore?limit=4`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.startups) {
          const mapped = data.startups.map((s) => ({
            id: s._id,
            name: s.name,
            role: s.industry || "Startup",
            stipend:
              s.capitalRaised && s.capitalRaised > 0
                ? `₹${(s.capitalRaised / 1_00_00_000).toFixed(1)}Cr raised`
                : "New startup",
            type: s.stage || "pre-seed",
            description: s.description,
            githubUrl:
              (s.githubRepos && s.githubRepos[0]?.url) || s.githubUrl || "",
            reward:
              (s.githubRepos && s.githubRepos[0]?.rewardDetails) || null,
          }));
          setStartupCards(mapped);
        }
      })
      .catch(() => {});

    // Contributions summary for collaboration count & score
    fetch(`/api/contributions/student/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.summary) {
          setCollaborations(data.summary.collaborationCount || 0);
          if (!contributionScore && data.summary.totalPoints != null) {
            setContributionScore(data.summary.totalPoints);
          }
        }
      })
      .catch(() => {});
  }, [contributionScore]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#050818] text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-[#050818] border-r border-slate-800/80">
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-sky-500/40">
              ST
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">
                Student Space
              </p>
              <p className="text-[11px] text-slate-500">
                Startup & Talent Hub
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 text-sm space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900 text-white">
            <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[11px]">
              🏠
            </span>
            Dashboard
          </button>

          <button
            onClick={() => navigate("/jobseeker/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              🔍
            </span>
            Job & Internship Search
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              🧪
            </span>
            Startup Explorer
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              🎖
            </span>
            Contributions & Rewards
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              📊
            </span>
            Analytics
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500">
          <p>
            Tip: Contribute to startup repos to increase your collaboration
            level.
          </p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-[#050818]/95 border-b border-slate-800/80 backdrop-blur">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="6" />
                  <path d="m20 20-4-4" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search startups, roles, or skills..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700/80 bg-slate-900/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications temporarily disabled */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Student</p>
                <p className="text-sm font-medium text-slate-100">
                    {profile?.personalInfo?.firstName ||
                      profile?.personalInfo?.lastName ||
                      storedUser?.fullName ||
                      "You"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-100">
                {(
                  profile?.personalInfo?.firstName ||
                  storedUser?.fullName ||
                  "S"
                ).charAt(0)}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-auto px-4 md:px-8 py-6 md:py-8 bg-[#050818] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.14),transparent_55%)]">
          {/* Top row: profile + startup explorer summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profile & skills panel (two-thirds) */}
            <section className="lg:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-lg font-semibold">
                    {(
                      profile?.personalInfo?.firstName ||
                      storedUser?.fullName ||
                      "S"
                    ).charAt(0)}
                  </div>
                  <div>
                    <p>Rishov Saha</p>
                    {/* <p className="text-sm font-semibold text-slate-50">
                      {profile?.personalInfo
                        ? `${profile.personalInfo.firstName || ""} ${
                            profile.personalInfo.lastName || ""
                          }`.trim()
                        : storedUser?.fullName || "Student Name"}
                    </p> */}
                    <p className="text-xs text-slate-400">
                      {profile?.professionalInfo?.currentTitle ||
                        "Add your current role / program"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Contribution Score{" "}
                      <span className="font-semibold text-indigo-600">
                        {contributionScore}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/jobseeker/profile")}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100"
                >
                  View account
                </button>
              </div>

              {/* Skills row */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-xs font-semibold text-slate-200 mb-1">
                    Technical Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.skills?.technical || ["React", "JavaScript"]).map(
                      (skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="px-2 py-1 rounded-full bg-indigo-500/20 text-[11px] text-indigo-200"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-xs font-semibold text-slate-200 mb-1">
                    Soft Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.skills?.soft || ["Communication", "Teamwork"]).map(
                      (skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="px-2 py-1 rounded-full bg-amber-500/20 text-[11px] text-amber-100"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Profile completion bar */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Profile completion</span>
                    <span>{completion.completionPercentage || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                      style={{
                        width: `${completion.completionPercentage || 0}%`,
                      }}
                    />
                  </div>
                </div>
                {!completion.isProfileComplete && (
                  <button
                    onClick={() => navigate("/jobseeker/profile")}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
                  >
                    Complete profile
                  </button>
                )}
              </div>
            </section>

            {/* Contribution summary / analytics (right) */}
            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-100">
                  Contribution Tracker
                </p>
                <span className="text-[11px] text-emerald-400 font-medium">
                  +1,000 pts
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Track your open‑source and startup contributions over time.
              </p>
              <div className="h-24 rounded-xl bg-gradient-to-br from-indigo-500/20 to-slate-900 border border-dashed border-slate-700 flex items-end gap-1 px-3 pb-2 text-[11px] text-slate-400">
                {[10, 25, 40, 55, 45, 65, 80].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-full bg-gradient-to-t from-sky-400 to-violet-300"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Repos</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">7</p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">PRs merged</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-400">
                    18
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Collab level</p>
                  <p className="mt-1 text-sm font-semibold text-indigo-300">
                    Silver
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Middle row: Startup explorer + Job/Internship card + Rewards */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Startup Explorer (2 cols) */}
            <section className="xl:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-100">
                    Startup Explorer
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Discover startups and their open‑source projects.
                  </p>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <button className="px-3 py-1 rounded-full bg-slate-900 text-white">
                    Top Rated
                  </button>
                  <button className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">
                    AI
                  </button>
                  <button className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">
                    Open Source
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                {startupCards.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 hover:bg-slate-800 cursor-pointer"
                  >
                    <p className="text-[11px] font-semibold text-slate-100">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {s.role} • {s.type}
                    </p>
                    {s.stipend && (
                      <p className="mt-1 text-[11px] text-slate-300">
                        {s.stipend}
                      </p>
                    )}
                    {s.description && (
                      <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                    {s.reward && (
                      <p className="mt-1 text-[11px] text-emerald-300">
                        Reward: {s.reward}
                      </p>
                    )}
                    {s.githubUrl && (
                      <a
                        href={s.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-[11px] text-sky-300 font-medium"
                      >
                        View GitHub repo →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Rewards & offers */}
            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 flex flex-col backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-100">
                  Rewards & Offers
                </p>
                <button className="text-[11px] text-sky-300 font-medium">
                  View all
                </button>
              </div>
              <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-violet-500 text-white p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-sky-100 mb-1">
                    Swag Box
                  </p>
                  <p className="text-sm font-semibold">
                    Win goodies for high contribution score
                  </p>
                  <p className="mt-1 text-[11px] text-sky-100/90">
                    Custom t‑shirt, laptop stickers & exclusive startup
                    sessions.
                  </p>
                </div>
                <button className="mt-3 w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white text-indigo-600 hover:bg-slate-100">
                  Claim Reward
                </button>
              </div>
            </section>
          </div>

          {/* Bottom row: Student analytics + collaboration count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="md:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-100">
                  Student Analytics
                </p>
                <span className="text-[11px] text-slate-500">
                  Last 6 months
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Track your skill growth and startup collaborations.
              </p>
              <div className="h-24 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-700/40 border border-dashed border-slate-700 px-3 flex items-end gap-1 text-[11px] text-slate-400">
                {[15, 30, 20, 35, 45, 55].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-full bg-gradient-to-t from-slate-500 to-sky-300"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </section>

            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <p className="text-xs font-semibold text-slate-100 mb-1">
                Startup Collaborations
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {collaborations} startups
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Number of startups you have contributed to.
              </p>
              <button className="mt-3 text-[11px] text-sky-300 font-medium">
                View contribution history →
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

