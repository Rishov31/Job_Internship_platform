import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleRoleClick = (roleKey) => {
    // Map UI roles to backend roles for registration
    const roleMap = {
      student: "jobseeker",
      startup: "employer",
      investor: "investor",
    };
    const mapped = roleMap[roleKey] || "jobseeker";
    navigate(`/register?role=${mapped}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050818] text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 bg-[#050818]/80 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 via-sky-400 to-cyan-300 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <span className="text-sm font-bold tracking-tight">HT</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight">HireTalent</span>
              <span className="text-[11px] text-slate-400 -mt-1">
                Startup & MSME Talent Ecosystem
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-200">
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Roles
            </a>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-full border border-slate-600/70 text-sm hover:bg-white/5 transition-colors"
              >
                Login
              </Link>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 text-sm font-semibold shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all"
              >
                Get Started
              </button>
            </div>
          </nav>

          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-600/70 text-slate-200"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Hero / Landing image section */}
      <main className="flex-1 flex flex-col">
        <section className="relative flex-1 flex items-center justify-center overflow-hidden">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-32 w-[420px] h-[420px] bg-indigo-500/40 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.14),_transparent_55%)]" />
          </div>

          <div className="relative max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16 flex flex-col lg:flex-row items-stretch gap-10 lg:gap-14">
            {/* Left content overlay (blank side of image) */}
            <div className="flex-1 flex flex-col justify-center max-w-xl space-y-6 md:space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300 shadow-lg shadow-indigo-500/20">
                <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Trusted by 50+ startups & MSMEs
              </div>

              <div className="space-y-3 md:space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight">
                  <span className="block text-slate-200">
                    Best platform to
                  </span>
                  <span className="block bg-gradient-to-r from-violet-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                    showcase your Talent
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300/80 max-w-md">
                  Connect Students, Startups and Investors on a single, immersive
                  talent ecosystem. Build projects, ship open‑source, and grow real
                  startup careers.
                </p>
              </div>

              {/* Role selection CTAs */}
              <div id="roles" className="space-y-3 md:space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Choose your role to begin
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleRoleClick("student")}
                    className="group relative overflow-hidden rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-4 text-left shadow-lg shadow-sky-500/30 hover:border-sky-400 hover:bg-sky-500/20 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-sky-200 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                        Student
                      </div>
                      <p className="text-sm font-semibold text-slate-50">
                        Discover jobs & internships
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleClick("startup")}
                    className="group relative overflow-hidden rounded-2xl border border-violet-500/40 bg-violet-500/10 px-4 py-4 text-left shadow-lg shadow-violet-500/30 hover:border-violet-400 hover:bg-violet-500/20 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-fuchsia-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-violet-200 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-300" />
                        Startup
                      </div>
                      <p className="text-sm font-semibold text-slate-50">
                        Hire contributors & talent
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleClick("investor")}
                    className="group relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-left shadow-lg shadow-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-200 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                        Investor
                      </div>
                      <p className="text-sm font-semibold text-slate-50">
                        Track growth & invest smart
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* How it works anchor */}
              <div id="how-it-works" className="mt-2 space-y-2 text-[11px] text-slate-400">
                <p>
                  1. Register with your role & profile • 2. Explore startups & projects •
                  3. Contribute, get verified and unlock rewards.
                </p>
              </div>
            </div>

            {/* Right: live-style dashboard preview */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-xl">
                <div className="absolute -inset-6 bg-gradient-to-tr from-indigo-500/40 via-sky-500/10 to-transparent blur-3xl opacity-80" />

                <div className="relative rounded-3xl border border-slate-700/70 bg-[#050b1f]/90 overflow-hidden shadow-[0_40px_120px_rgba(15,23,42,0.95)] p-4 sm:p-5 space-y-4">
                  {/* Top: startup growth mini-chart */}
                  <div className="rounded-2xl bg-gradient-to-r from-slate-900/80 via-indigo-900/70 to-slate-900/80 border border-slate-700/60 px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-slate-400">Startup growth overview</p>
                      <p className="text-sm font-semibold text-slate-50 mt-1">
                        NovaGenAI • Healthcare AI
                      </p>
                    </div>
                    <div className="relative w-28 h-14">
                      <div className="absolute inset-1 rounded-lg bg-gradient-to-b from-indigo-500/40 to-cyan-400/10 opacity-70" />
                      <div className="absolute inset-px border border-indigo-400/40 rounded-lg" />
                      <div className="absolute inset-2 flex items-end justify-between gap-1">
                        {[12, 18, 22, 30, 38, 45].map((h, idx) => (
                          <div
                            key={idx}
                            className="w-[3px] rounded-full bg-gradient-to-t from-cyan-300 to-violet-300"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle: key stats */}
                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 px-3 py-3">
                      <p className="text-slate-400 mb-1">Total Capital</p>
                      <p className="text-sm font-semibold text-sky-300">₹4.5Cr</p>
                      <p className="mt-1 text-[10px] text-emerald-400">+18% this year</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 px-3 py-3">
                      <p className="text-slate-400 mb-1">Contributors</p>
                      <p className="text-sm font-semibold text-violet-200">58</p>
                      <p className="mt-1 text-[10px] text-violet-400">Active builders</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 px-3 py-3">
                      <p className="text-slate-400 mb-1">Open Positions</p>
                      <p className="text-sm font-semibold text-emerald-200">12</p>
                      <p className="mt-1 text-[10px] text-emerald-400">% Open 32%</p>
                    </div>
                  </div>

                  {/* Bottom: search jobs & internships preview */}
                  <div className="rounded-2xl bg-slate-900/80 border border-slate-700/70 px-3 py-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-slate-100">
                        Search Jobs & Internships
                      </p>
                      <span className="text-[10px] text-slate-400">Live from HireTalent</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/70 px-2 py-1.5 text-[11px] text-slate-300">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-[9px]">
                        🔍
                      </span>
                      <span className="truncate">
                        Frontend Intern • Remote • React, TypeScript, Tailwind
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-xl bg-slate-800/80 px-2.5 py-2 border border-slate-700/70">
                        <p className="text-slate-300">Student Dashboard</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Track contributions & rewards
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 px-2.5 py-2 border border-slate-700/70">
                        <p className="text-slate-300">Investor View</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Monitor portfolio & ROI
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Faint background image for depth */}
                  <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen">
                    <img
                      src="/Landing.png"
                      alt="Startup & talent analytics dashboard"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About strip */}
        <section
          id="about"
          className="border-t border-slate-800/60 bg-gradient-to-r from-[#050818] via-slate-900/40 to-[#050818]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-300/90">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                About platform
              </span>
            </div>
            <p className="max-w-3xl text-slate-300/80">
              HireTalent connects ambitious students with high‑growth startups and
              investors. Build a public contribution graph from GitHub, unlock rewards,
              and convert real work into internships, offers and funding.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-[#050818]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>© {new Date().getFullYear()} HireTalent. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <button className="hover:text-slate-300 transition-colors">
              Privacy
            </button>
            <button className="hover:text-slate-300 transition-colors">
              Terms
            </button>
            <button className="hover:text-slate-300 transition-colors">
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

