import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import ContributionGithubChart from "../../components/ContributionGithubChart";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentContributions() {
  const { authUser } = useOutletContext();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [claims, setClaims] = useState([]);
  const [ghActivity, setGhActivity] = useState(null);
  const [ghLoading, setGhLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    const headers = { ...authHeader() };

    fetch("/api/contributions/student/me", { headers, credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setContributions(data.contributions || []);
        setSummary(data.summary || null);
      })
      .catch(() => {});

    fetch("/api/rewards/me", { headers, credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.claims) setClaims(data.claims);
      })
      .catch(() => {});

    fetch("/api/contributions/github/activity", { headers, credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setGhActivity(data))
      .catch(() => setGhActivity(null))
      .finally(() => setGhLoading(false));
  }, [authUser]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50">Contributions & Rewards</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track submissions, GitHub activity on startup repos, and reward claims.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div className="rounded-lg bg-slate-800/80 p-3">
            <p className="text-slate-400">Platform points</p>
            <p className="text-lg font-semibold text-slate-100 mt-1">
              {summary?.totalPoints ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3">
            <p className="text-slate-400">Approved</p>
            <p className="text-lg font-semibold text-emerald-400 mt-1">
              {summary?.approvedCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3">
            <p className="text-slate-400">Startups (platform)</p>
            <p className="text-lg font-semibold text-slate-100 mt-1">
              {summary?.collaborationCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3">
            <p className="text-slate-400">GitHub repos (30d)</p>
            <p className="text-lg font-semibold text-sky-300 mt-1">
              {ghActivity?.totalCommitsAndPRs ?? 0}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-2">GitHub activity (startup repos)</h2>
        <ContributionGithubChart
          data={ghActivity?.chart || []}
          loading={ghLoading}
          emptyMessage="No GitHub data. Add your GitHub username in profile."
        />
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">Reward claims</h2>
        {claims.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            No claims yet. Use &quot;Claim Reward&quot; on the dashboard after contributing.
          </p>
        ) : (
          <ul className="space-y-2 text-[11px]">
            {claims.map((c) => (
              <li
                key={c._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2"
              >
                <span className="text-slate-200 font-medium">{c.offerTitle}</span>
                <span className="text-slate-400">
                  {c.startup?.name || "Startup"} —{" "}
                  <span
                    className={
                      c.status === "fulfilled"
                        ? "text-emerald-400"
                        : c.status === "acknowledged"
                          ? "text-amber-300"
                          : "text-sky-300"
                    }
                  >
                    {c.status}
                  </span>
                </span>
                <span className="text-slate-500">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">Contribution submissions</h2>
        {contributions.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            No formal submissions yet. Founders can also award you from GitHub activity.
          </p>
        ) : (
          <ul className="space-y-2">
            {contributions.map((c) => (
              <li
                key={c._id}
                className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-[11px]"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-slate-100">
                    {c.startup?.name || "Startup"}
                  </span>
                  <span
                    className={
                      c.status === "approved"
                        ? "text-emerald-400"
                        : c.status === "rejected"
                          ? "text-red-400"
                          : "text-amber-300"
                    }
                  >
                    {c.status}
                  </span>
                </div>
                {c.repoUrl && (
                  <a
                    href={c.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 mt-1 inline-block"
                  >
                    Repo
                  </a>
                )}
                {c.pointsAwarded > 0 && (
                  <p className="text-slate-400 mt-1">+{c.pointsAwarded} pts</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => navigate("/student/dashboard")}
        className="text-sm text-sky-400 hover:text-sky-300"
      >
        ← Back to dashboard
      </button>
    </div>
  );
}
