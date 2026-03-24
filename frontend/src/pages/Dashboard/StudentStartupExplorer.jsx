import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentStartupExplorer() {
  const { authUser } = useOutletContext();
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    fetch("/api/startups/explore?limit=48", {
      headers: { ...authHeader() },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.startups) return;
        setStartups(
          data.startups.map((s) => ({
            id: s._id,
            name: s.name,
            industry: s.industry || "Startup",
            stage: s.stage || "pre-seed",
            description: s.description,
            openPositionsCount: s.openPositionsCount ?? 0,
            capitalLabel:
              s.capitalRaised && s.capitalRaised > 0
                ? `₹${(s.capitalRaised / 1_00_00_000).toFixed(1)}Cr raised`
                : "New startup",
            githubUrl:
              (s.githubRepos && s.githubRepos[0]?.url) || s.githubUrl || "",
            reward:
              (s.githubRepos && s.githubRepos[0]?.rewardDetails) || null,
          }))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-50">Startup Explorer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse every startup on HireMe with open repos and contribution rewards.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading startups…</p>
      ) : startups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center text-slate-400 text-sm">
          No startups yet. Founders can register and add their company profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {startups.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 backdrop-blur hover:border-sky-500/40 transition-colors flex flex-col"
            >
              <h2 className="text-sm font-semibold text-slate-100">{s.name}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {s.industry} • {s.stage}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{s.capitalLabel}</p>
              {s.openPositionsCount > 0 && (
                <p className="text-[11px] text-sky-300 font-medium mt-1">
                  {s.openPositionsCount} open position{s.openPositionsCount === 1 ? "" : "s"}
                </p>
              )}
              {s.description && (
                <p className="mt-2 text-[11px] text-slate-400 line-clamp-3">
                  {s.description}
                </p>
              )}
              {s.reward && (
                <p className="mt-2 text-[11px] text-emerald-300">Reward: {s.reward}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/student/explore/${s.id}`}
                  className="inline-flex text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-sky-600/30 text-sky-200 border border-sky-500/40 hover:bg-sky-600/40"
                >
                  Company profile & open roles →
                </Link>
              </div>
              {s.githubUrl ? (
                <a
                  href={s.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[11px] text-sky-300 font-medium"
                >
                  View GitHub repo →
                </a>
              ) : (
                <p className="mt-2 text-[11px] text-slate-600">No repo linked</p>
              )}
            </article>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/student/dashboard")}
        className="mt-8 text-sm text-sky-400 hover:text-sky-300"
      >
        ← Back to dashboard
      </button>
    </div>
  );
}
