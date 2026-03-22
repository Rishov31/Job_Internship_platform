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
import { me, logoutUser } from "../../api/authApi";
// import NotificationBell from "../../components/NotificationBell";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

export default function InvestorDashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [investorProfile, setInvestorProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalPortfolio, setTotalPortfolio] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [portfolioRoiPercent, setPortfolioRoiPercent] = useState(0);
  const [discovery, setDiscovery] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [selectedStartupId, setSelectedStartupId] = useState("");
  const [investAmount, setInvestAmount] = useState("20000");
  const [investLoading, setInvestLoading] = useState(false);
  const [investError, setInvestError] = useState("");
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [profileForm, setProfileForm] = useState({
    firmName: "",
    bio: "",
    investmentFocus: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const navigate = useNavigate();
  const [navSection, setNavSection] = useState("discovery");
  const discoveryRef = useRef(null);
  const portfolioRef = useRef(null);
  const transactionsRef = useRef(null);
  const analyticsRef = useRef(null);

  const scrollToSection = (ref, id) => {
    setNavSection(id);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadOverview = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    try {
      const res = await fetch(`${API_BASE}/investor/overview`, {
        headers,
        credentials: "include",
      });
      const data = res.ok ? await res.json() : null;
      if (!data) return;
      setDiscovery(data.discovery?.startups || []);
      setWalletBalance(data.walletBalance ?? 0);
      const p = data.portfolio || {};
      setTotalPortfolio((p.totalInvestment || 0) / 1_00_00_000);
      setTotalValue((p.totalCurrentValue || 0) / 1_00_00_000);
      setPortfolioRoiPercent(Number(p.portfolioRoiPercent) || 0);
      setPortfolioItems(p.items || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!investorProfile) return;
    setProfileForm({
      firmName: investorProfile.firmName || "",
      bio: investorProfile.bio || "",
      investmentFocus: (investorProfile.investmentFocus || []).join(", "),
    });
  }, [investorProfile]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const user = await me();
      if (cancelled) return;
      if (!user) {
        navigate("/login");
        return;
      }
      if (user.role !== "investor" && !user.isAdmin) {
        if (user.role === "jobseeker") navigate("/student/dashboard");
        else if (user.role === "employer") navigate("/startup/dashboard");
        else navigate("/");
        return;
      }
      setAuthUser(user);
      if (typeof user.walletBalance === "number") {
        setWalletBalance(user.walletBalance);
      }
      try {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isAdmin: user.isAdmin,
          })
        );
        localStorage.setItem("role", user.role || "");
      } catch {
        // ignore
      }

      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await loadOverview();

      fetch(`${API_BASE}/investor/profile`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          setInvestorProfile(data);
        })
        .catch(() => {});

      fetch(`${API_BASE}/mentorship-requests/for-provider`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : { requests: [] }))
        .then((data) => {
          if (cancelled) return;
          setMentorshipRequests(data.requests || []);
        })
        .catch(() => {});
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, loadOverview]);

  useEffect(() => {
    if (!discovery.length) return;
    setSelectedStartupId((prev) => {
      if (prev && discovery.some((s) => s._id === prev)) return prev;
      return discovery[0]._id;
    });
  }, [discovery]);

  const selectedStartup = discovery.find((s) => s._id === selectedStartupId);
  const valuationNum = Number(selectedStartup?.valuation) || 150_000;
  const investAmtNum = Number(String(investAmount).replace(/,/g, "")) || 0;
  const estimatedShare =
    valuationNum > 0 && investAmtNum > 0
      ? (investAmtNum / valuationNum) * 100
      : 0;

  const handleConfirmInvest = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedStartupId) return;
    setInvestLoading(true);
    setInvestError("");
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await fetch(`${API_BASE}/investor/invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          startupId: selectedStartupId,
          amount: investAmtNum,
          idempotencyKey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInvestError(data.message || "Investment failed");
        return;
      }
      await loadOverview();
      if (typeof data.walletBalance === "number") {
        setWalletBalance(data.walletBalance);
      }
    } catch {
      setInvestError("Network error. Please try again.");
    } finally {
      setInvestLoading(false);
    }
  };

  const chartData = portfolioItems.map((item, i) => ({
    name: (item.startupName || `S${i + 1}`).slice(0, 12),
    invested: (item.invested || 0) / 1_00_000,
    value: (item.currentValue || 0) / 1_00_000,
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

  const saveInvestorProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingProfile(true);
    try {
      const focus = profileForm.investmentFocus
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${API_BASE}/investor/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          firmName: profileForm.firmName.trim(),
          bio: profileForm.bio.trim(),
          investmentFocus: focus,
        }),
      });
      const data = await res.json();
      if (res.ok) setInvestorProfile(data);
    } catch {
      // ignore
    } finally {
      setSavingProfile(false);
    }
  };

  const refreshInvestorMentorship = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/mentorship-requests/for-provider`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = res.ok ? await res.json() : { requests: [] };
    setMentorshipRequests(data.requests || []);
  };

  const proposeInvestorMentorship = async (reqId) => {
    const start = window.prompt(
      "Proposed start (ISO 8601)",
      new Date(Date.now() + 864e5).toISOString()
    );
    if (!start) return;
    const minutes = parseInt(
      window.prompt("Session length (minutes)", "30") || "30",
      10
    );
    const pricePerMinute = parseFloat(
      window.prompt("Price per minute (INR)", "150") || "0"
    );
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
      window.alert(data.message || "Failed");
      return;
    }
    window.alert("Slot sent to the student.");
    refreshInvestorMentorship();
  };

  const rejectInvestorMentorship = async (reqId) => {
    const note = window.prompt("Optional note", "") || "";
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
    refreshInvestorMentorship();
  };

  return (
    <div className="min-h-screen flex bg-[#050818] text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#050818] border-r border-slate-800/80">
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sky-500/40">
              IH
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">InnovateHub</p>
              <p className="text-[11px] text-slate-500">Investor Space</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
            Discovery
          </div>
          <button
            type="button"
            onClick={() => scrollToSection(discoveryRef, "discovery")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              navSection === "discovery"
                ? "bg-slate-900 text-white"
                : "hover:bg-slate-800/80 text-slate-200"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                navSection === "discovery" ? "bg-white/10" : "bg-slate-800"
              }`}
            >
              🔍
            </span>
            Startup Discovery
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(portfolioRef, "portfolio")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
              navSection === "portfolio"
                ? "bg-slate-900 text-white"
                : "hover:bg-slate-800/80 text-slate-200"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                navSection === "portfolio" ? "bg-white/10" : "bg-slate-800"
              }`}
            >
              💼
            </span>
            Portfolio
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(transactionsRef, "transactions")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
              navSection === "transactions"
                ? "bg-slate-900 text-white"
                : "hover:bg-slate-800/80 text-slate-200"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                navSection === "transactions" ? "bg-white/10" : "bg-slate-800"
              }`}
            >
              📄
            </span>
            Transactions
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(analyticsRef, "analytics")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
              navSection === "analytics"
                ? "bg-slate-900 text-white"
                : "hover:bg-slate-800/80 text-slate-200"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                navSection === "analytics" ? "bg-white/10" : "bg-slate-800"
              }`}
            >
              📊
            </span>
            Analytics
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500">
          <p>Need help? Reach out to our team anytime.</p>
        </div>
      </aside>

      {/* Main content */}
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
                placeholder="Search startups..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700/80 bg-slate-900/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications temporarily disabled */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Wallet</p>
                <p className="text-sm font-semibold text-emerald-300">
                  ₹{(walletBalance / 1_00_000).toFixed(2)}L
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Investor</p>
                <p className="text-sm font-medium text-slate-100">
                  {investorProfile?.firmName || authUser?.fullName || "…"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-100">
                {(investorProfile?.firmName || authUser?.fullName || "IN")
                  .toString()
                  .slice(0, 2)
                  .toUpperCase()}
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

        {/* Content grid */}
        <main className="flex-1 overflow-auto bg-[#050818] px-4 md:px-8 py-6 md:py-8 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),transparent_55%)]">
          {/* Top row: discovery + financial insights + invest module */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Startup Discovery */}
            <section
              ref={discoveryRef}
              className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur scroll-mt-24"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Startup Discovery
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filter startups by industry, stage & growth index.
                  </p>
                </div>
                <span className="inline-flex text-[11px] px-2 py-1 rounded-full bg-slate-900 text-sky-300 font-medium border border-sky-500/60">
                  Total ₹{totalPortfolio.toFixed(1)}Cr
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                <button className="px-3 py-1 rounded-full bg-slate-900 text-white">
                  AI
                </button>
                <button className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">
                  Fintech
                </button>
                <button className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">
                  EdTech
                </button>
                <button className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">
                  Health
                </button>
              </div>

              <div className="space-y-3">
                {discovery.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between rounded-xl border border-slate-700 px-3 py-3 hover:bg-slate-900 cursor-pointer bg-slate-900/80"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-50">
                        {s.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {s.industry || "Startup"} • {s.stage || "pre-seed"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Capital ₹{((s.capitalRaised || 0) / 1_00_00_000).toFixed(
                          1
                        )}
                        Cr • Growth{" "}
                        <span className="text-emerald-400 font-medium">
                          +45%
                        </span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                        Active
                      </span>
                      <button className="block w-full text-[11px] mt-1 text-sky-300 font-medium">
                        Add to Portfolio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Financial Insights */}
            <section
              ref={analyticsRef}
              className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur scroll-mt-24"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Financial Insights
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Portfolio revenue, growth and simulated ROI.
                  </p>
                </div>
                <span
                  className={`inline-flex text-[11px] px-2 py-1 rounded-full font-medium border ${
                    portfolioRoiPercent >= 0
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-500/10 text-rose-300 border-rose-500/40"
                  }`}
                >
                  ROI {portfolioRoiPercent >= 0 ? "+" : ""}
                  {portfolioRoiPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-40 mb-3 rounded-xl bg-gradient-to-b from-indigo-500/20 to-slate-900 border border-dashed border-slate-700 text-xs text-slate-400 overflow-hidden p-2">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
                        formatter={(v) => [`₹${Number(v).toFixed(2)}L`, ""]}
                      />
                      <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} name="Current (L)" />
                      <Line type="monotone" dataKey="invested" stroke="#38bdf8" strokeWidth={2} dot={false} name="Invested (L)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    Invest to see portfolio value vs. invested (₹L).
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <p className="text-slate-400">Monthly Revenue</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    ₹15L / month
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <p className="text-slate-400">Avg. Growth</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-400">
                    +38% / year
                  </p>
                </div>
              </div>
            </section>

            {/* Investment Module */}
            <section
              ref={transactionsRef}
              className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur scroll-mt-24"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Investment Module
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Simulate share % before confirming your ticket.
                  </p>
                </div>
                <span className="inline-flex text-[11px] px-2 py-1 rounded-full bg-slate-900 text-slate-100 font-medium">
                  Live
                </span>
              </div>

              <div className="space-y-3 text-[11px]">
                <label className="block text-slate-600">
                  Select startup
                  <select
                    value={selectedStartupId}
                    onChange={(e) => setSelectedStartupId(e.target.value)}
                    className="mt-1 w-full text-xs rounded-lg border border-slate-700 px-2 py-1.5 bg-slate-900/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                  >
                    {discovery.length === 0 ? (
                      <option value="">No startups yet</option>
                    ) : (
                      discovery.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} • {s.stage || "pre-seed"}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block text-slate-600">
                  Investment amount
                  <div className="mt-1 flex items-center rounded-lg border border-slate-700 px-2 py-1.5 bg-slate-900/80 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-400">
                    <span className="text-xs text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-xs text-slate-100"
                      placeholder="20000"
                    />
                    <span className="text-[11px] text-slate-400 ml-1">INR</span>
                  </div>
                </label>

                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Estimated share</span>
                  <span className="font-semibold text-emerald-400">
                    {estimatedShare > 0 ? `${estimatedShare.toFixed(2)}%` : "—"}
                  </span>
                </div>

                {investError ? (
                  <p className="text-[11px] text-rose-400">{investError}</p>
                ) : null}

                <button
                  type="button"
                  onClick={handleConfirmInvest}
                  disabled={
                    investLoading ||
                    !selectedStartupId ||
                    !investAmtNum ||
                    investAmtNum <= 0
                  }
                  className="w-full mt-2 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {investLoading ? "Processing…" : "Confirm Investment"}
                </button>
              </div>
            </section>
          </div>

          {/* Mentorship requests from students */}
          <section className="mb-6 rounded-2xl border border-violet-500/30 bg-slate-900/70 p-5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Student mentorship requests
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Same flow as founders: propose slot & rate, then student pays to unlock chat/video.
                </p>
              </div>
              <Link
                to="/investor/mentor-chats"
                className="text-[11px] text-sky-300 font-medium shrink-0"
              >
                Mentor chats →
              </Link>
            </div>
            {mentorshipRequests.length === 0 ? (
              <p className="text-[11px] text-slate-500">No requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {mentorshipRequests.map((mr) => (
                  <li
                    key={mr._id}
                    className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2 text-[11px]"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-100 font-medium">
                        {mr.student?.fullName}{" "}
                        <span className="text-slate-500 font-normal">
                          {mr.student?.email}
                        </span>
                      </span>
                      <span className="text-violet-300 capitalize">{mr.status}</span>
                    </div>
                    {mr.message && (
                      <p className="text-slate-400 mt-1 line-clamp-2">{mr.message}</p>
                    )}
                    {mr.status === "slot_proposed" && (
                      <p className="text-amber-200/90 mt-1">
                        Awaiting student payment · ₹{mr.totalAmount} total
                      </p>
                    )}
                    {mr.status === "pending" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => proposeInvestorMentorship(mr._id)}
                          className="px-3 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-500"
                        >
                          Propose slot & pricing
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectInvestorMentorship(mr._id)}
                          className="px-3 py-1 rounded-lg border border-slate-600 text-slate-300"
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

          {/* Investor profile (stored in DB) */}
          <section className="mb-6 bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Investor profile
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saved to your account. Completion:{" "}
                  {investorProfile?.profileCompletionPercentage ?? 0}%
                </p>
              </div>
            </div>
            <form onSubmit={saveInvestorProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <label className="block text-slate-300 md:col-span-2">
                Firm / fund name
                <input
                  value={profileForm.firmName}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, firmName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
                />
              </label>
              <label className="block text-slate-300 md:col-span-2">
                Focus areas (comma-separated)
                <input
                  value={profileForm.investmentFocus}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      investmentFocus: e.target.value,
                    }))
                  }
                  placeholder="e.g. AI, Climate, MSME"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
                />
              </label>
              <label className="block text-slate-300 md:col-span-2">
                Bio
                <textarea
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100"
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 disabled:opacity-60"
                >
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          </section>

          {/* Bottom row: Portfolio overview */}
          <section
            ref={portfolioRef}
            className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur scroll-mt-24"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  My Portfolio
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track invested startups, current value and growth.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <div>
                  <p className="text-slate-400">Total Investment</p>
                  <p className="font-semibold text-sky-300">
                    ₹{totalPortfolio.toFixed(1)}Cr
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Current Value</p>
                  <p className="font-semibold text-emerald-400">
                    ₹{totalValue.toFixed(1)}Cr
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-[11px] text-slate-400 border-b border-slate-800">
                    <th className="py-2 pr-4">Startup</th>
                    <th className="py-2 px-4">Invested</th>
                    <th className="py-2 px-4">Current Value</th>
                    <th className="py-2 px-4">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioItems.map((item) => (
                    <tr key={String(item.id)} className="border-b border-slate-800">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-900 text-white text-[10px] flex items-center justify-center">
                            {(item.startupName || "S").charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-100 text-xs">
                              {item.startupName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {item.industry || "Startup"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-slate-200">
                        ₹{(item.invested / 1_00_000).toFixed(1)}L
                      </td>
                      <td className="py-2 px-4 text-slate-200">
                        ₹{(item.currentValue / 1_00_000).toFixed(1)}L
                      </td>
                      <td
                        className={`py-2 px-4 font-semibold ${
                          (item.roiPercent ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {(item.roiPercent ?? 0) >= 0 ? "+" : ""}
                        {Number(item.roiPercent ?? 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

