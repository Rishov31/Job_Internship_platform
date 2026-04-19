import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { me, logoutUser } from "../api/authApi";
import StudentSidebar from "../components/student/StudentSidebar";

export default function StudentLayout() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      if (user.role !== "jobseeker" && !user.isAdmin) {
        if (user.role === "employer") navigate("/startup/dashboard");
        else if (user.role === "investor") navigate("/investor/dashboard");
        else navigate("/");
        return;
      }
      setAuthUser(user);
      try {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isAdmin: user.isAdmin,
            githubUsername: user.githubUsername || "",
          })
        );
        localStorage.setItem("role", user.role || "");
      } catch {
        // ignore
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
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

  if (loading || !authUser) {
    return (
      <div className="h-screen bg-[#050818] text-slate-400 flex items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  const displayName = authUser.fullName || "Student";
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className="h-screen flex overflow-hidden bg-[#050818] text-slate-100">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-60 overflow-hidden">
        <header className="h-14 md:h-16 shrink-0 z-30 px-4 md:px-8 flex items-center justify-between gap-4 border-b border-slate-800/90 bg-[#050818]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[#050818]/75 shadow-[0_1px_0_0_rgba(15,23,42,0.6)]">
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xl">
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
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700/90 bg-slate-900/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/60 transition-shadow"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Student</p>
                <p className="text-sm font-medium text-slate-100 leading-tight">{displayName}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 ring-2 ring-slate-600/80 flex items-center justify-center text-xs font-semibold text-slate-100">
                {initial}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-600/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-slate-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4 md:px-8 py-5 md:py-6 bg-[#050818] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_50%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.1),transparent_50%)]">
          <Outlet context={{ authUser, displayName, initial }} />
        </main>
      </div>
    </div>
  );
}
