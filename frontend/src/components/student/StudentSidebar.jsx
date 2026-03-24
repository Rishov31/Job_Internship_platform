import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const items = [
  { path: "/student/dashboard", label: "Dashboard", icon: "🏠" },
  { path: "/student/applications", label: "Applications", icon: "📋" },
  { path: "/jobseeker/jobs", label: "Job & Internship Search", icon: "🔍" },
  { path: "/student/explore", label: "Startup Explorer", icon: "🧪" },
  { path: "/student/resources", label: "Career Resources", icon: "📚" },
  { path: "/student/mentorship", label: "Mentorship", icon: "🎓" },
  { path: "/student/contributions", label: "Contributions & Rewards", icon: "🎖" },
  { path: "/student/analytics", label: "Analytics", icon: "📊" },
];

export default function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden md:flex w-60 flex-col bg-[#050818] border-r border-slate-800/80">
      <div className="h-16 px-6 flex items-center border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-sky-500/40">
            ST
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-50">Student Space</p>
            <p className="text-[11px] text-slate-500">Startup & Talent Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 text-sm space-y-1">
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                active
                  ? "bg-slate-900 text-white"
                  : "hover:bg-slate-800/80 text-slate-200"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] ${
                  active ? "bg-white/10" : "bg-slate-800"
                }`}
              >
                {icon}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500">
        <p>
          Tip: Contribute to startup repos to increase your collaboration level.
        </p>
      </div>
    </aside>
  );
}
