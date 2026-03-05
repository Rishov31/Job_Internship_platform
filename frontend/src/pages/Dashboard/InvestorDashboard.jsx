import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import NotificationBell from "../../components/NotificationBell";

export default function InvestorDashboard() {
  const [totalPortfolio, setTotalPortfolio] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [discovery, setDiscovery] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const API_BASE =
      import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("token");

    fetch(`${API_BASE}/investor/overview`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setDiscovery(data.discovery?.startups || []);
        const p = data.portfolio || {};
        setTotalPortfolio((p.totalInvestment || 0) / 1_00_00_000);
        setTotalValue((p.totalCurrentValue || 0) / 1_00_00_000);
        setPortfolioItems(p.items || []);
      })
      .catch(() => {
        // ignore and keep zeros if API not available
      });
  }, []);

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
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium">
            <span className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-xs">
              🔍
            </span>
            Startup Discovery
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-xs">
              💼
            </span>
            Portfolio
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-xs">
              📄
            </span>
            Transactions
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200">
            <span className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-xs">
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
                <p className="text-xs text-slate-400">Investor</p>
                <p className="text-sm font-medium text-slate-100">You</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-100">
                IN
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
            <section className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur">
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
            <section className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Financial Insights
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Portfolio revenue, growth and simulated ROI.
                  </p>
                </div>
                <span className="inline-flex text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/40">
                  ROI +133%
                </span>
              </div>
              <div className="h-40 mb-3 rounded-xl bg-gradient-to-b from-indigo-500/20 to-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-400">
                Growth graph placeholder – plug your chart library here.
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
            <section className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur">
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
                  <select className="mt-1 w-full text-xs rounded-lg border border-slate-700 px-2 py-1.5 bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400">
                    {discovery.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} • {s.stage || "pre-seed"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-slate-600">
                  Investment amount
                  <div className="mt-1 flex items-center rounded-lg border border-slate-700 px-2 py-1.5 bg-slate-900/80 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-400">
                    <span className="text-xs text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      className="flex-1 bg-transparent outline-none text-xs text-slate-900"
                      placeholder="20,000"
                    />
                    <span className="text-[11px] text-slate-400 ml-1">INR</span>
                  </div>
                </label>

                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Estimated share</span>
                  <span className="font-semibold text-emerald-600">13.3%</span>
                </div>

                <button className="w-full mt-2 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600">
                  Confirm Investment
                </button>
              </div>
            </section>
          </div>

          {/* Bottom row: Portfolio overview */}
          <section className="bg-slate-900/70 rounded-2xl border border-slate-700/70 shadow-xl p-5 backdrop-blur">
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
                    <th className="py-2 px-4">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800">
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
                      <td className="py-2 px-4 font-semibold text-emerald-400">
                        {item.growthPercent >= 0 ? "+" : ""}
                        {item.growthPercent}%
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

