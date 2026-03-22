import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import NotificationBell from "../../components/NotificationBell";
import { me, logoutUser } from "../../api/authApi";
import { getJobStats, getEmployerJobs } from "../../api/jobApi";

// High-level startup founder dashboard – employer job module stays as sub‑module.

export default function StartupDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalCapitalCr: 0,
    totalInvestors: 0,
    contributors: 0,
    activeProjects: 0,
    openPositions: 0,
  });
  const [startup, setStartup] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState({
    completionPercentage: 0,
    isProfileComplete: false,
  });
  const [jobCards, setJobCards] = useState([]);
  const navigate = useNavigate();

  const recomputeStatsFromStartup = (s, prev) => {
    if (!s) return prev || stats;
    return {
      ...(prev || stats),
      totalCapitalCr: (s.capitalRaised || 0) / 1_00_00_000,
      totalInvestors: s.totalInvestors || 0,
      contributors: s.contributorsCount || 0,
      activeProjects: s.activeProjects || 0,
    };
  };

  const handleRaiseFunding = async () => {
    const input = window.prompt("Enter funding amount in INR (e.g. 500000)", "");
    if (!input) return;
    const amount = Number(String(input).replace(/,/g, ""));
    if (!amount || amount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/startups/me/funding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          alert(
            "Forbidden: this action is only available for Startup accounts. Please login with a Startup (employer) role."
          );
        } else {
          alert(data.message || "Failed to raise funding");
        }
        return;
      }
      setStartup(data.startup);
      setStats((prev) => recomputeStatsFromStartup(data.startup, prev));
    } catch (e) {
      alert("Error raising funding. Please try again.");
    }
  };

  const handleLinkRepository = async () => {
    const url = window.prompt("Enter GitHub repository URL", "");
    if (!url) return;
    const rewardDetails = window.prompt(
      "Describe contribution rewards (optional)",
      "Innovation badge + goodies"
    );
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/startups/me/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ url, rewardDetails }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          alert(
            "Forbidden: this action is only available for Startup accounts. Please login with a Startup (employer) role."
          );
        } else {
          alert(data.message || "Failed to link repository");
        }
        return;
      }
      setStartup(data.startup);
      setStats((prev) => recomputeStatsFromStartup(data.startup, prev));
    } catch (e) {
      alert("Error linking repository. Please try again.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const userData = await me();
        if (!userData) {
          navigate("/login");
          return;
        }
        if (userData.role !== "employer" && !userData.isAdmin) {
          if (userData.role === "jobseeker") navigate("/student/dashboard");
          else if (userData.role === "investor") navigate("/investor/dashboard");
          else navigate("/");
          return;
        }
        setUser(userData);
        try {
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: userData.id,
              fullName: userData.fullName,
              email: userData.email,
              role: userData.role,
              isAdmin: userData.isAdmin,
            })
          );
          localStorage.setItem("role", userData.role || "");
        } catch {
          // ignore
        }

        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const [jobStats, employerJobs, startupRes] = await Promise.all([
          getJobStats().catch(() => null),
          getEmployerJobs({ limit: 3 }).catch(() => ({ jobs: [] })),
          fetch(`/api/startups/me`, {
            credentials: "include",
            headers: authHeaders,
          }).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (startupRes?.completion) {
          setProfileCompletion(startupRes.completion);
        }
        if (startupRes?.startup) {
          const s = startupRes.startup;
          setStartup(s);
          setStats((prev) => ({
            ...prev,
            totalCapitalCr: (s.capitalRaised || 0) / 1_00_00_000, // rough INR->Cr
            totalInvestors: s.totalInvestors || 0,
            contributors: s.contributorsCount || 0,
            activeProjects: s.activeProjects || 0,
          }));
        }

        if (jobStats) {
          setStats((prev) => ({
            ...prev,
            openPositions: jobStats.activeJobs || prev.openPositions,
          }));
        }
        setJobCards(employerJobs.jobs || []);
      } catch {
        // ignore for now – placeholders already set
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
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
              SH
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">
                Startup Hub
              </p>
              <p className="text-[11px] text-slate-500">Founder Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 text-sm space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900 text-white">
            <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[11px]">
              📈
            </span>
            Overview
          </button>

          <button
            onClick={() => navigate("/startup/profile")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              🏢
            </span>
            Company profile
            {!profileCompletion.isProfileComplete && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                {profileCompletion.completionPercentage}%
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/employer/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              💼
            </span>
            Job & Internship Posting
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              🧑‍💻
            </span>
            Open Source Collaboration
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              💰
            </span>
            Funding & Capital
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              🎓
            </span>
            Mentorship & Guidance
          </button>
        </nav>
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
                placeholder="Search anything..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700/80 bg-slate-900/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications temporarily disabled */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Founder</p>
                <p className="text-sm font-medium text-slate-100">
                  {user?.fullName || "You"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-100">
                {(user?.fullName || "S").charAt(0)}
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

        {/* Body – mimic the Startup Overview layout */}
        <main className="flex-1 overflow-auto px-4 md:px-8 py-6 md:py-8 bg-[#050818] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),transparent_55%)]">
          {!profileCompletion.isProfileComplete && (
            <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  Complete your company profile
                </p>
                <p className="text-xs text-amber-100/80 mt-0.5">
                  {profileCompletion.completionPercentage}% done — add industry,
                  description (40+ chars), website, and links to reach 70%.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/startup/profile")}
                className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-xs font-bold hover:bg-amber-400"
              >
                Continue →
              </button>
            </div>
          )}
          {/* Top row: startup overview + job posting summary + funding card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Startup Overview panel */}
            <section className="lg:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-100">
                    Startup Overview
                  </p>
                  <p className="text-sm font-semibold text-slate-50 mt-1">
                    {startup?.name || user?.companyDetails?.name || "Your Startup Name"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {startup?.industry && `${startup.industry} • `}Growth Index:{" "}
                    <span className="text-emerald-600">High</span>
                  </p>
                </div>
                <div className="text-right text-[11px]">
                  <p className="text-slate-400">Total Capital</p>
                  <p className="text-lg font-semibold text-sky-300">
                    ₹{stats.totalCapitalCr}Cr
                  </p>
                </div>
              </div>
              <div className="h-28 rounded-xl bg-gradient-to-br from-indigo-500/20 to-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-400">
                {startup?.capitalHistory && startup.capitalHistory.length > 0 ? (
                  <div className="w-full h-full flex items-end gap-1 px-3 pb-2">
                    {startup.capitalHistory.slice(-8).map((entry, idx) => (
                      <div
                        key={`${entry.date}-${idx}`}
                        className="flex-1 rounded-full bg-gradient-to-t from-sky-400 to-indigo-300"
                        style={{
                          height: `${Math.min(
                            100,
                            (entry.amount / (startup.capitalRaised || 1)) * 100 +
                              15
                          )}%`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <>Capital / growth graph placeholder.</>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Investors</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {stats.totalInvestors}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Contributors</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {stats.contributors}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Active Projects</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {stats.activeProjects}
                  </p>
                </div>
              </div>
            </section>

            {/* Funding & capital management compact card */}
            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-100">
                  Funding & Capital
                </p>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Target ₹10Cr
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Track your round progress and raise new capital.
              </p>
              <div className="h-20 rounded-xl bg-gradient-to-br from-emerald-400/20 to-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-300">
                ₹{stats.totalCapitalCr.toFixed(2)}Cr raised so far.
              </div>
              <button
                onClick={handleRaiseFunding}
                className="mt-3 w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Raise Funding
              </button>
            </section>
          </div>

          {/* Middle row: Job & Internship posting + Open Source collaboration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Job & Internship Posting */}
            <section className="lg:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-100">
                  Job & Internship Posting
                </p>
                <button
                  onClick={() => navigate("/employer/post-job")}
                  className="text-[11px] text-sky-300 font-semibold px-3 py-1.5 rounded-lg bg-slate-900/80 border border-sky-500/60 hover:bg-slate-900"
                >
                  + Post Job
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Quick overview of your latest roles. Manage full details in the
                Employer Dashboard.
              </p>
              {jobCards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 py-8 text-center text-[11px] text-slate-400">
                  No postings yet. Create your first job from the Employer
                  Dashboard.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  {jobCards.map((job) => (
                    <div
                      key={job._id}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 p-3"
                    >
                      <p className="text-sm font-semibold text-slate-50">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {job.company} • {job.location}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Status:{" "}
                        <span className="font-medium text-emerald-400">
                          {job.status}
                        </span>
                      </p>
                      <Link
                        to="/employer/jobs"
                        className="mt-2 inline-block text-[11px] text-sky-300 font-medium"
                      >
                        Manage posting →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Open Source Collaboration */}
            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 flex flex-col backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-100">
                  Open Source Collaboration
                </p>
                <span className="text-[11px] text-slate-400">
                  Rewards enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Link your GitHub repos, post open issues and define contribution
                rewards for students.
              </p>
              <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-100 mb-1">
                    GitHub Integration
                  </p>
                  <p className="text-sm font-semibold">
                    Showcase active projects & onboard contributors
                  </p>
                </div>
                <button
                  onClick={handleLinkRepository}
                  className="mt-3 w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white text-indigo-600 hover:bg-slate-100"
                >
                  Link Repository
                </button>
              </div>
            </section>
          </div>

          {/* Bottom row: Mentorship & Investor connect style cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mentorship & Guidance */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">
                  Mentorship & Guidance
                </p>
                <button className="text-[11px] text-indigo-600 font-medium">
                  View all
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Request mentor sessions with investors or seasoned founders.
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-[11px]">
                <p className="font-semibold text-slate-900 mb-1">
                  Mark Thompson
                </p>
                <p className="text-slate-500 mb-2">Data Science Expert</p>
                <button className="w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  Start Session
                </button>
              </div>
            </section>

            {/* Placeholder for additional analytics / investor connect */}
            <section className="lg:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <p className="text-xs font-semibold text-slate-100 mb-1">
                Open Positions & Investor Signals
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Snapshot of hiring pipeline and investor interest. Integrate
                with real metrics later.
              </p>
              <div className="h-24 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-700/40 border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-400">
                Graph / table placeholder – connect to real KPIs.
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

