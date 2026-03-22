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
      <div className="min-h-screen bg-[#050818] text-slate-400 flex items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  const displayName = authUser.fullName || "Student";
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#050818] text-slate-100">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-[#050818]/95 border-b border-slate-800/80 backdrop-blur shrink-0">
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
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Student</p>
                <p className="text-sm font-medium text-slate-100">{displayName}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-100">
                {initial}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 md:px-8 py-6 md:py-8 bg-[#050818] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.14),transparent_55%)]">
          <Outlet context={{ authUser, displayName, initial }} />
        </main>
      </div>
    </div>
  );
}
