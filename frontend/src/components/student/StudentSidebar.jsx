import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const items = [
  { path: "/student/dashboard", label: "Dashboard", icon: "🏠" },
  { path: "/student/applications", label: "Applications", icon: "📋" },
  { path: "/jobseeker/jobs", label: "Job & Internship Search", icon: "🔍" },
  { path: "/student/explore", label: "Startup Explorer", icon: "🧪" },
  { path: "/student/community", label: "Community chat", icon: "💬" },
  { path: "/student/resources", label: "Career Resources", icon: "📚" },
  { path: "/student/mentorship", label: "Mentorship", icon: "🎓" },
  { path: "/student/contributions", label: "Contributions & Rewards", icon: "🎖" },
  { path: "/student/analytics", label: "Analytics", icon: "📊" },
];

export default function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-slate-800/90 bg-[#030712]/95 backdrop-blur-md shadow-[4px_0_24px_-8px_rgba(0,0,0,0.45)]">
      <div className="h-14 shrink-0 px-5 flex items-center border-b border-slate-800/90 bg-gradient-to-r from-slate-900/50 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">
            ST
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-50 tracking-tight truncate">
              Student Space
            </p>
            <p className="text-[10px] text-slate-500 truncate">Startup & Talent Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 text-[13px] space-y-0.5">
        {items.map(({ path, label, icon }) => {
          const isJobseeker = path.startsWith("/jobseeker");
          const isResources = path === "/student/resources";
          const isApplications = path === "/student/applications";
          const active = isJobseeker
            ? location.pathname.startsWith("/jobseeker")
            : isResources
              ? location.pathname.startsWith("/student/resources")
              : isApplications
                ? location.pathname === "/student/applications"
                : location.pathname === path ||
                  (path === "/student/dashboard" &&
                    location.pathname === "/student");

          return (
            <button
              key={path + label}
              type="button"
              onClick={() => navigate(path)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                active
                  ? "bg-gradient-to-r from-indigo-500/25 to-sky-500/10 text-white border border-indigo-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  : "text-slate-300 border border-transparent hover:bg-slate-800/70 hover:text-slate-100 hover:border-slate-700/50"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] transition-colors ${
                  active
                    ? "bg-white/15 text-white ring-1 ring-white/10"
                    : "bg-slate-800/90 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                }`}
              >
                {icon}
              </span>
              <span className={`truncate font-medium ${active ? "text-slate-50" : ""}`}>
                {label}
              </span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 p-3 border-t border-slate-800/90 text-[10px] text-slate-500 leading-relaxed bg-slate-950/40">
        <p className="text-slate-500">
          Tip: contribute to startup repos to raise your collaboration level.
        </p>
      </div>
    </aside>
  );
}
