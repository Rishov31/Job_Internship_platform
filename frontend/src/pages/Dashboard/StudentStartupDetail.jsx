import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentStartupDetail() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const [startup, setStartup] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startupId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/startups/${startupId}/overview`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/startups/${startupId}/jobs`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([ov, j]) => {
        if (cancelled) return;
        setStartup(ov?.startup || null);
        setJobs(j?.jobs || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [startupId]);

  if (loading) {
    return (
      <div className="text-sm text-slate-400 py-12 text-center">Loading startup…</div>
    );
  }

  if (!startup) {
    return (
      <div className="rounded-2xl border border-slate-700 p-8 text-center text-slate-400">
        Startup not found.
        <button
          type="button"
          onClick={() => navigate("/student/explore")}
          className="mt-4 block w-full text-sky-400"
        >
          ← Back to explorer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={() => navigate("/student/explore")}
        className="mb-4 text-sm text-sky-400 hover:text-sky-300"
      >
        ← Startup Explorer
      </button>

      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-50">{startup.name}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {startup.industry || "Startup"} · {startup.stage || "pre-seed"}
        </p>
        {startup.capitalRaised > 0 && (
          <p className="text-xs text-emerald-400 mt-2">
            ₹{(startup.capitalRaised / 1_00_00_000).toFixed(1)}Cr raised
          </p>
        )}
        {startup.description && (
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">{startup.description}</p>
        )}
        {startup.websiteUrl && (
          <a
            href={startup.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-3 text-sm text-sky-400 hover:underline"
          >
            Website →
          </a>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Open positions</h2>
          <span className="text-xs text-slate-500">{jobs.length} role(s)</span>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500 text-sm">
            No open roles from this startup yet. Check back later.
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job._id}
                className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-slate-100">{job.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.location} · {job.category}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    to={`/jobseeker/jobs/${job._id}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-600 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Details
                  </Link>
                  <Link
                    to={`/jobseeker/jobs/${job._id}/apply`}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500"
                  >
                    Apply
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
