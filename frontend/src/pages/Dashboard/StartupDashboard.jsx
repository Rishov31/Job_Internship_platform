import React, { useCallback, useRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// import NotificationBell from "../../components/NotificationBell";
import ContributorLeaderboard from "../../components/ContributorLeaderboard";
import { me, logoutUser } from "../../api/authApi";
import { getJobStats, getEmployerJobs } from "../../api/jobApi";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

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
  const [growthPoints, setGrowthPoints] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState({
    completionPercentage: 0,
    isProfileComplete: false,
  });
  const [jobCards, setJobCards] = useState([]);
  const [ghSummary, setGhSummary] = useState(null);
  const [rewardClaims, setRewardClaims] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [ghContributor, setGhContributor] = useState(null);
  const [awarding, setAwarding] = useState(false);
  const navigate = useNavigate();
  const overviewRef = useRef(null);
  const jobsRef = useRef(null);
  const ossRef = useRef(null);
  const fundingRef = useRef(null);
  const mentorshipRef = useRef(null);

  const scrollToPanel = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchGrowthSeries = useCallback(async (startupId) => {
    if (!startupId) {
      setGrowthPoints([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/startups/${startupId}/growth`, {
        credentials: "include",
      });
      const data = res.ok ? await res.json() : [];
      setGrowthPoints(Array.isArray(data) ? data : []);
    } catch {
      setGrowthPoints([]);
    }
  }, []);

  const recomputeStatsFromStartup = (s, prev) => {
    if (!s) return prev || stats;
    const invCount = Array.isArray(s.investors)
      ? s.investors.length
      : s.totalInvestors || 0;
    return {
      ...(prev || stats),
      totalCapitalCr: (s.capitalRaised || 0) / 1_00_00_000,
      totalInvestors: invCount,
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
      const res = await fetch(`${API_BASE}/startups/me/funding`, {
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
      const res = await fetch(`${API_BASE}/startups/me/repos`, {
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

        const [jobStats, employerJobs, startupRes, ghRes, claimsRes, mentRes] =
          await Promise.all([
            getJobStats().catch(() => null),
            getEmployerJobs({ limit: 3 }).catch(() => ({ jobs: [] })),
            fetch(`${API_BASE}/startups/me`, {
              credentials: "include",
              headers: authHeaders,
            }).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API_BASE}/startups/me/github/summary`, {
              credentials: "include",
              headers: authHeaders,
            }).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API_BASE}/rewards/startup/me`, {
              credentials: "include",
              headers: authHeaders,
            }).then((r) => (r.ok ? r.json() : null)),
            fetch(`${API_BASE}/mentorship-requests/for-provider`, {
              credentials: "include",
              headers: authHeaders,
            }).then((r) => (r.ok ? r.json() : null)),
          ]);

        if (ghRes) setGhSummary(ghRes);
        if (claimsRes?.claims) setRewardClaims(claimsRes.claims);
        if (mentRes?.requests) setMentorshipRequests(mentRes.requests);

        if (startupRes?.completion) {
          setProfileCompletion(startupRes.completion);
        }
        if (startupRes?.startup) {
          const s = startupRes.startup;
          setStartup(s);
          setStats((prev) => ({
            ...prev,
            totalCapitalCr: (s.capitalRaised || 0) / 1_00_00_000, // rough INR->Cr
            totalInvestors: Array.isArray(s.investors)
              ? s.investors.length
              : s.totalInvestors || 0,
            contributors: s.contributorsCount || 0,
            activeProjects: s.activeProjects || 0,
          }));
          await fetchGrowthSeries(s._id);
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
  }, [navigate, fetchGrowthSeries]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible" || !startup?._id) return;
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch(`${API_BASE}/startups/me`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.startup) return;
          const s = data.startup;
          setStartup(s);
          setStats((prev) => recomputeStatsFromStartup(s, prev));
          fetchGrowthSeries(s._id);
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [startup?._id, fetchGrowthSeries]);

  const targetFundingInr = startup?.targetFunding ?? 100_000_000;
  const targetFundingCr = targetFundingInr / 1_00_00_000;
  const fundingProgressPct = Math.min(
    100,
    ((startup?.capitalRaised || 0) / targetFundingInr) * 100
  );
  const growthChartData = growthPoints.map((g) => ({
    date: new Date(g.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    capitalCr: (g.capital || 0) / 1_00_00_000,
  }));

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

  const handleAwardContributor = async () => {
    if (!ghContributor?.login) return;
    const pointsStr = window.prompt("Points to award (default 150)", "150");
    if (pointsStr === null) return;
    const points = Number(pointsStr) || 150;
    const token = localStorage.getItem("token");
    setAwarding(true);
    try {
      const res = await fetch("/api/contributions/founder/award", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          githubUsername: ghContributor.login,
          points,
          description: `Reward for ${ghContributor.count} recent commits (GitHub)`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.message || "Could not award");
        return;
      }
      window.alert(
        `Awarded ${points} pts to ${data.student?.fullName || ghContributor.login}. They will see it under Contributions.`
      );
      setGhContributor(null);
    } catch {
      window.alert("Network error");
    } finally {
      setAwarding(false);
    }
  };

  const updateClaimStatus = async (claimId, status) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/rewards/${claimId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.message || "Update failed");
        return;
      }
      setRewardClaims((prev) =>
        prev.map((c) =>
          c._id === claimId ? { ...c, status: data.claim?.status || status } : c
        )
      );
    } catch {
      window.alert("Network error");
    }
  };

  const refreshMentorshipRequests = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/mentorship-requests/for-provider`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = res.ok ? await res.json() : { requests: [] };
    setMentorshipRequests(data.requests || []);
  };

  const proposeStartupMentorship = async (reqId) => {
    const start = window.prompt(
      "Proposed start (ISO 8601), e.g. 2026-03-26T15:00:00.000Z",
      new Date(Date.now() + 864e5).toISOString()
    );
    if (!start) return;
    const minutes = parseInt(
      window.prompt("Session length (minutes)", "30") || "30",
      10
    );
    const pricePerHour = parseFloat(
      window.prompt("Price per hour (INR)", "6000") || "0"
    );
    const pricePerMinute = Math.max(pricePerHour / 60, 0);
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE}/mentorship-requests/${reqId}/propose-slot`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ startTime: start, minutes, pricePerMinute }),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data.message || "Failed to propose slot");
      return;
    }
    window.alert("Slot sent. Student can pay under Student → Mentorship.");
    refreshMentorshipRequests();
  };

  const rejectStartupMentorship = async (reqId) => {
    const note = window.prompt("Optional note for the student", "") || "";
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/mentorship-requests/${reqId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ note }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert(data.message || "Failed");
      return;
    }
    refreshMentorshipRequests();
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
          <button
            type="button"
            onClick={() => scrollToPanel(overviewRef)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900 text-white"
          >
            <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[11px]">
              📈
            </span>
            Overview
          </button>

          <button
            type="button"
            onClick={() => navigate("/startup/community")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              💬
            </span>
            Community chat
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
            type="button"
            onClick={() => scrollToPanel(jobsRef)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              💼
            </span>
            Job & Internship Posting
          </button>

          <button
            type="button"
            onClick={() => scrollToPanel(ossRef)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              🧑‍💻
            </span>
            Open Source Collaboration
          </button>

          <button
            type="button"
            onClick={() => scrollToPanel(fundingRef)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px]">
              💰
            </span>
            Funding & Capital
          </button>

          <button
            type="button"
            onClick={() => scrollToPanel(mentorshipRef)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200"
          >
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
          <div ref={overviewRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
              <div className="h-28 rounded-xl bg-gradient-to-br from-indigo-500/20 to-slate-900 border border-dashed border-slate-700 text-[11px] text-slate-400 overflow-hidden p-2">
                {growthChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
                        formatter={(v) => [`₹${Number(v).toFixed(2)}Cr`, "Capital raised"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="capitalCr"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        name="Capital (Cr)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    Capital / growth history appears after funding or investment.
                  </div>
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
            <section
              ref={fundingRef}
              className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-100">
                  Funding & Capital
                </p>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Target ₹{targetFundingCr.toFixed(0)}Cr
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Track your round progress and raise new capital.
              </p>
              <div className="rounded-xl bg-gradient-to-br from-emerald-400/20 to-slate-900 border border-dashed border-slate-700 p-3 text-[11px] text-slate-300">
                <div className="flex justify-between mb-2">
                  <span>₹{stats.totalCapitalCr.toFixed(2)}Cr raised</span>
                  <span className="text-emerald-400 font-semibold">
                    {fundingProgressPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-500"
                    style={{ width: `${fundingProgressPct}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleRaiseFunding}
                className="mt-3 w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Raise Funding
              </button>
            </section>
          </div>

          <ContributorLeaderboard apiBase={API_BASE} />

          {/* Middle row: Job & Internship posting + Open Source collaboration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Job & Internship Posting */}
            <section
              ref={jobsRef}
              className="lg:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur"
            >
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
            <section
              ref={ossRef}
              className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 flex flex-col backdrop-blur"
            >
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

          {/* Student reward claims (Swag Box etc.) */}
          <section className="mb-6 bg-slate-900/70 rounded-2xl shadow-xl border border-amber-500/20 p-5 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-100">
                  Reward claims from students
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Shown when students tap &quot;Claim Reward&quot; on their dashboard (linked to your startup).
                </p>
              </div>
            </div>
            {rewardClaims.length === 0 ? (
              <p className="text-[11px] text-slate-500">No pending claims yet.</p>
            ) : (
              <ul className="space-y-2">
                {rewardClaims.map((c) => (
                  <li
                    key={c._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2 text-[11px]"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">
                        {c.offerTitle}{" "}
                        <span className="text-slate-500 font-normal">
                          — {c.student?.fullName || "Student"}
                        </span>
                      </p>
                      <p className="text-slate-500">{c.student?.email}</p>
                      <p className="text-amber-200/90 mt-1">
                        Status: <span className="capitalize">{c.status}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {c.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateClaimStatus(c._id, "acknowledged")}
                            className="px-3 py-1 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600"
                          >
                            Acknowledge
                          </button>
                          <button
                            type="button"
                            onClick={() => updateClaimStatus(c._id, "fulfilled")}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            Mark fulfilled
                          </button>
                        </>
                      )}
                      {c.status === "acknowledged" && (
                        <button
                          type="button"
                          onClick={() => updateClaimStatus(c._id, "fulfilled")}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          Mark fulfilled
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* GitHub: recent contributors across linked repos (7d) */}
          <section className="mb-6 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-100">
                  Repo contributors (last 7 days)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Commits on your linked GitHub repos (public). Set{" "}
                  <code className="text-sky-300">GITHUB_TOKEN</code> on the server
                  for reliable API limits.
                </p>
              </div>
              {ghSummary?.recentTotal != null && (
                <span className="text-[11px] text-emerald-400 font-semibold shrink-0">
                  {ghSummary.recentTotal} commits
                </span>
              )}
            </div>
            {ghSummary?.repos?.length > 0 && (
              <p className="text-[10px] text-slate-500 mb-3 break-all">
                Tracking: {ghSummary.repos.join(" · ")}
              </p>
            )}
            {!ghSummary?.repos?.length && (
              <p className="text-[11px] text-slate-500 mb-3">
                Link repositories from{" "}
                <button
                  type="button"
                  onClick={() => navigate("/startup/profile")}
                  className="text-sky-400 underline"
                >
                  Company profile
                </button>{" "}
                or use &quot;Link Repository&quot; above.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {(ghSummary?.topContributors || []).length === 0 ? (
                <span className="text-[11px] text-slate-500">
                  No recent commits fetched (add public repos or check API
                  limits).
                </span>
              ) : (
                ghSummary.topContributors.map((t) => (
                  <button
                    key={t.login}
                    type="button"
                    onClick={() => setGhContributor(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-600 text-[11px] text-slate-200 hover:border-sky-500/60 hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="text-sky-300 font-mono">@{t.login}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-emerald-400 font-semibold">
                      {t.count} commits
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Student mentorship (requests + slot / pricing) */}
          <section
            ref={mentorshipRef}
            className="mb-6 rounded-2xl border border-indigo-500/30 bg-slate-900/70 p-5 backdrop-blur scroll-mt-24"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-100">
                  Student mentorship requests
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Propose time, duration, and ₹/hour. After Stripe payment, chat and video unlock.
                </p>
              </div>
              <Link
                to="/startup/mentor-chats"
                className="text-[11px] text-sky-300 font-medium shrink-0"
              >
                Mentor chats →
              </Link>
            </div>
            {mentorshipRequests.length === 0 ? (
              <p className="text-[11px] text-slate-500">No mentorship requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {mentorshipRequests.map((mr) => (
                  <li
                    key={mr._id}
                    className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2 text-[11px]"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-100 font-medium">
                        {mr.student?.fullName || "Student"}{" "}
                        <span className="text-slate-500 font-normal">
                          · {mr.student?.email}
                        </span>
                      </span>
                      <span className="text-sky-300 capitalize">{mr.status}</span>
                    </div>
                    {mr.message && (
                      <p className="text-slate-400 mt-1 line-clamp-2">{mr.message}</p>
                    )}
                    {mr.status === "slot_proposed" && (
                      <p className="text-amber-200/90 mt-1">
                        Awaiting payment ·{" "}
                        {mr.proposedStartTime
                          ? new Date(mr.proposedStartTime).toLocaleString()
                          : ""}{" "}
                        · {mr.proposedMinutes}m · ₹{mr.totalAmount} total
                      </p>
                    )}
                    {mr.status === "pending" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => proposeStartupMentorship(mr._id)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                        >
                          Propose slot & pricing
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectStartupMentorship(mr._id)}
                          className="px-3 py-1 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

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

          {ghContributor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-5 shadow-2xl text-slate-100">
                <p className="text-sm font-semibold text-slate-50">Contributor</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  GitHub activity on your linked repos (last 7 days).
                </p>
                <div className="mt-4 rounded-xl bg-slate-800/80 border border-slate-700 p-3 text-[11px] space-y-2">
                  <p>
                    <span className="text-slate-500">Login</span>{" "}
                    <span className="font-mono text-sky-300">@{ghContributor.login}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Commits</span>{" "}
                    <span className="text-emerald-400 font-semibold">{ghContributor.count}</span>
                  </p>
                  <a
                    href={`https://github.com/${ghContributor.login}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-sky-400 hover:underline"
                  >
                    Open GitHub profile →
                  </a>
                </div>
                <p className="text-[10px] text-slate-500 mt-3">
                  If they use the same GitHub username on HireMe, you can award platform points
                  (creates an approved contribution).
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={awarding}
                    onClick={handleAwardContributor}
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {awarding ? "Awarding…" : "Award points / reward"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGhContributor(null)}
                    className="px-3 py-2 rounded-lg border border-slate-600 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

