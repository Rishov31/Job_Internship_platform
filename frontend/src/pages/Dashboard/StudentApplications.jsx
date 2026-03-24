import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function statusStyle(status) {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-200 border-amber-500/40";
    case "reviewing":
      return "bg-slate-500/20 text-slate-200 border-slate-500/40";
    case "shortlisted":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
    case "interview":
      return "bg-violet-500/20 text-violet-200 border-violet-500/40";
    case "accepted":
      return "bg-sky-500/20 text-sky-200 border-sky-500/40";
    case "rejected":
      return "bg-rose-500/20 text-rose-200 border-rose-500/40";
    default:
      return "bg-slate-700/50 text-slate-300 border-slate-600";
  }
}

export default function StudentApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/jobseeker/applications", {
      headers: { ...authHeader() },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setApplications(data.applications || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingInterviews = applications.filter(
    (a) =>
      a.status === "interview" ||
      (a.metadata && (a.metadata.interview || a.metadata.interviewSessionId))
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400 text-sm">
        Loading applications…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Applications</h1>
          <p className="text-sm text-slate-400 mt-1">
            Jobs you applied to and upcoming interviews.
          </p>
        </div>
        <Link
          to="/jobseeker/jobs"
          className="text-sm font-medium px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-500"
        >
          Find more jobs
        </Link>
      </div>

      {/* Upcoming interviews */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <span className="text-lg">📅</span> Upcoming interviews
        </h2>
        {upcomingInterviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500">
            No scheduled interviews yet. When an employer shortlists you or sets an
            interview, it will show here.
          </div>
        ) : (
          <ul className="space-y-3">
            {upcomingInterviews.map((app) => (
              <li
                key={app._id}
                className="rounded-2xl border border-violet-500/30 bg-violet-950/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-100">
                      {app.job?.title || "Role"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {app.job?.company} · {app.job?.location}
                    </p>
                    {app.metadata?.interview && (
                      <p className="text-xs text-violet-200/90 mt-2">
                        {[
                          app.metadata.interview.date,
                          app.metadata.interview.time,
                          app.metadata.interview.location,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        {app.metadata.interview.notes && (
                          <span className="block text-slate-500 mt-1">
                            {app.metadata.interview.notes}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {app.metadata?.interviewSessionId && (
                      <Link
                        to={`/interview/coding/${app.metadata.interviewSessionId}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                      >
                        Join coding interview
                      </Link>
                    )}
                    {app.job?._id && (
                      <Link
                        to={`/jobseeker/jobs/${app.job._id}`}
                        className="text-xs text-sky-400 hover:underline"
                      >
                        View job →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* All applications */}
      <section>
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <span className="text-lg">📋</span> All applications
        </h2>
        {applications.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-8 text-center text-slate-400 text-sm">
            You haven&apos;t applied to any jobs yet.
            <button
              type="button"
              onClick={() => navigate("/jobseeker/jobs")}
              className="block mx-auto mt-4 text-sky-400 font-medium"
            >
              Browse jobs
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {applications.map((app) => (
              <li
                key={app._id}
                className="rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-100 truncate">
                    {app.job?.title || "Job"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {app.job?.company} · Applied{" "}
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusStyle(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                  {app.job?._id && (
                    <Link
                      to={`/jobseeker/jobs/${app.job._id}`}
                      className="text-[11px] text-sky-400 hover:underline"
                    >
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => navigate("/student/dashboard")}
        className="mt-10 text-sm text-sky-400 hover:text-sky-300"
      >
        ← Back to dashboard
      </button>
    </div>
  );
}
