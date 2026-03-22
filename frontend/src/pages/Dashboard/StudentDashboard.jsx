import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ContributionGithubChart from "../../components/ContributionGithubChart";
import StartupPointsLineChart from "../../components/StartupPointsLineChart";
// import NotificationBell from "../../components/NotificationBell";

// This dashboard is a higher-level student view.
// Job & internship search remain in the existing jobseeker module (sub‑module).

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Last N months: points awarded per month (from startup approvals) + running cumulative */
function buildMonthlyStartupPointsSeries(contributions, monthsBack = 6) {
  const now = new Date();
  const buckets = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      month: d.toLocaleString("default", { month: "short" }),
      points: 0,
    });
  }

  const approved = (contributions || []).filter(
    (c) => c.status === "approved" && (Number(c.pointsAwarded) || 0) > 0
  );

  for (const c of approved) {
    const raw = c.updatedAt || c.createdAt;
    if (!raw) continue;
    const dt = new Date(raw);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.points += Number(c.pointsAwarded) || 0;
  }

  let run = 0;
  return buckets.map(({ month, points, key }) => {
    run += points;
    return { month, points, cumulative: run, key };
  });
}

function studentDisplayName(profile, authUser) {
  // Account name from JWT-backed /auth/me is always correct for the logged-in user
  if (authUser?.fullName) return authUser.fullName;
  const pi = profile?.personalInfo;
  if (pi?.firstName || pi?.lastName) {
    return `${pi.firstName || ""} ${pi.lastName || ""}`.trim();
  }
  return "Student";
}

export default function StudentDashboard() {
  const outlet = useOutletContext();
  const authUser = outlet?.authUser;
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({
    completionPercentage: 0,
    isProfileComplete: false,
  });
  const [collaborations, setCollaborations] = useState(0);
  const [approvedContributions, setApprovedContributions] = useState(0);
  const [contributionScore, setContributionScore] = useState(0);
  const [startupCards, setStartupCards] = useState([]);
  const [ghActivity, setGhActivity] = useState(null);
  const [ghLoading, setGhLoading] = useState(true);
  /** null until first load of /contributions/student/me */
  const [contributions, setContributions] = useState(null);
  const navigate = useNavigate();

  const startupPointsChartData = useMemo(
    () => buildMonthlyStartupPointsSeries(contributions || []),
    [contributions]
  );

  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;
    const API_BASE = "/api";
    const headers = { ...authHeader() };

    // Load student profile basics from existing jobseeker profile
    fetch(`${API_BASE}/jobseeker/profile`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          setProfile(data);
          if (data?.contributionScore != null) {
            setContributionScore((prev) =>
              Math.max(prev, data.contributionScore || 0)
            );
          }
        })
        .catch(() => {
          if (!cancelled) setProfile(null);
        });

      fetch(`${API_BASE}/jobseeker/profile/completion`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          setCompletion(data);
        })
        .catch(() => {});

      fetch(`${API_BASE}/startups/explore?limit=8`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data?.startups) return;
          const mapped = data.startups.map((s) => ({
            id: s._id,
            name: s.name,
            role: s.industry || "Startup",
            stipend:
              s.capitalRaised && s.capitalRaised > 0
                ? `₹${(s.capitalRaised / 1_00_00_000).toFixed(1)}Cr raised`
                : "New startup",
            type: s.stage || "pre-seed",
            description: s.description,
            githubUrl:
              (s.githubRepos && s.githubRepos[0]?.url) || s.githubUrl || "",
            reward:
              (s.githubRepos && s.githubRepos[0]?.rewardDetails) || null,
          }));
          setStartupCards(mapped);
        })
        .catch(() => {});

      fetch(`${API_BASE}/contributions/student/me`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          // Always resolve chart loading (was stuck: contributions never set)
          if (!data) {
            setContributions([]);
            return;
          }
          setContributions(
            Array.isArray(data.contributions) ? data.contributions : []
          );
          if (data.summary) {
            setCollaborations(data.summary.collaborationCount || 0);
            setApprovedContributions(data.summary.approvedCount || 0);
            if (data.summary.totalPoints != null) {
              setContributionScore((prev) =>
                Math.max(prev, data.summary.totalPoints)
              );
            }
          }
        })
        .catch(() => {
          if (!cancelled) setContributions([]);
        });

      fetch(`${API_BASE}/contributions/github/activity`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          setGhActivity(data);
        })
        .catch(() => {
          if (!cancelled) setGhActivity(null);
        })
        .finally(() => {
          if (!cancelled) setGhLoading(false);
        });

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, navigate]);

  if (!authUser) return null;

  const displayName = studentDisplayName(profile, authUser);
  const initial = (displayName || "S").trim().charAt(0).toUpperCase();
  const githubStartupCount = Number(ghActivity?.githubStartupCount || 0);
  const collabDisplay = Math.max(Number(collaborations || 0), githubStartupCount);

  const handleClaimReward = async () => {
    const token = localStorage.getItem("token");
    const startupId =
      ghActivity?.topStartup?.startupId || startupCards[0]?.id || null;
    if (!startupId) {
      window.alert(
        "No startup selected. Contribute to a linked repo first, or open Startup Explorer and note a startup — then try again from the dashboard."
      );
      navigate("/student/explore");
      return;
    }
    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          startupId,
          offerTitle: "Swag Box",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.message || "Could not submit claim.");
        return;
      }
      window.alert(
        `Claim sent to ${data.claim?.startup?.name || "the startup"}! They will see it on their founder dashboard.`
      );
    } catch {
      window.alert("Network error. Try again.");
    }
  };

  return (
    <>
          {/* Top row: profile + startup explorer summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profile & skills panel (two-thirds) */}
            <section className="lg:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-lg font-semibold">
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {profile?.professionalInfo?.currentTitle ||
                        "Add your current role / program"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Contribution Score{" "}
                      <span className="font-semibold text-indigo-600">
                        {contributionScore}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => navigate("/jobseeker/profile")}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-800/80 text-slate-100 hover:bg-slate-800"
                  >
                    {completion.isProfileComplete ? "Edit profile" : "Complete profile"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/student/mentorship")}
                    className="text-[11px] font-medium text-sky-300 hover:text-sky-200"
                  >
                    Mentorship (founders & investors) →
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/student/resources")}
                    className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                  >
                    Career guidance resources →
                  </button>
                </div>
              </div>

              {/* Skills row */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-xs font-semibold text-slate-200 mb-1">
                    Technical Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.skills?.technical || []).length ? (
                      profile.skills.technical.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="px-2 py-1 rounded-full bg-indigo-500/20 text-[11px] text-indigo-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Add technical skills in your profile
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-xs font-semibold text-slate-200 mb-1">
                    Soft Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.skills?.soft || []).length ? (
                      profile.skills.soft.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="px-2 py-1 rounded-full bg-amber-500/20 text-[11px] text-amber-100"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Add soft skills in your profile
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile completion bar */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Profile completion</span>
                    <span>{completion.completionPercentage || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                      style={{
                        width: `${completion.completionPercentage || 0}%`,
                      }}
                    />
                  </div>
                </div>
                {!completion.isProfileComplete && (
                  <button
                    onClick={() => navigate("/jobseeker/profile")}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
                  >
                    Complete profile
                  </button>
                )}
              </div>
            </section>

            {/* Contribution summary / analytics (right) */}
            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs font-semibold text-slate-100">
                  Contribution Tracker
                </p>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-400 font-medium block">
                    {contributionScore > 0 ? `+${contributionScore} pts` : "0 pts"}{" "}
                    <span className="text-slate-500 font-normal">platform</span>
                  </span>
                  {ghActivity?.success && (
                    <span className="text-[10px] text-sky-300 block">
                      GitHub: {ghActivity.totalCommitsAndPRs ?? 0} commits/PRs (30d)
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Live GitHub activity across startup repos (all linked branches, not
                only <code className="text-sky-400">main</code>) — commits + merged
                PRs.
              </p>
              {ghActivity?.needsGithubUsername && (
                <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                  Add your{" "}
                  <span className="font-semibold">GitHub username</span> in your
                  profile to load real graphs.
                  <button
                    type="button"
                    onClick={() => navigate("/jobseeker/profile")}
                    className="ml-2 text-sky-300 underline font-medium"
                  >
                    Open profile
                  </button>
                </div>
              )}
              {ghActivity?.githubError && (
                <p className="mb-2 text-[11px] text-red-300">{ghActivity.message}</p>
              )}
              {ghActivity?.weeklyInsight?.message && ghActivity.success && (
                <p className="mb-2 text-[11px] text-slate-300 leading-snug">
                  {ghActivity.weeklyInsight.message}
                </p>
              )}
              {ghActivity?.success && (
                <div className="mb-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600">
                    🔥 {ghActivity.streak ?? 0}-day streak
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600">
                    GH level:{" "}
                    <span className="text-amber-200 font-semibold">
                      {ghActivity.level?.level || "Bronze"}
                    </span>
                  </span>
                  {ghActivity.topStartup?.name && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
                      Most active: {ghActivity.topStartup.name}
                    </span>
                  )}
                </div>
              )}
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-slate-900 border border-slate-700/80 px-1 pt-2 pb-1">
                <ContributionGithubChart
                  data={ghActivity?.chart || []}
                  loading={ghLoading}
                  emptyMessage={
                    ghActivity?.needsGithubUsername
                      ? "Connect GitHub to see daily bars."
                      : ghActivity?.message ||
                        "No activity in the last 14 days on tracked repos."
                  }
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {ghActivity?.reposScanned != null && ghActivity.success
                  ? `Scanning ${ghActivity.reposScanned} repo(s) from startups (multi-branch).`
                  : ""}
              </p>
              {ghActivity?.zeroActivityTip && ghActivity.success && (
                <p className="text-[10px] text-amber-200/90 mt-2 leading-snug border border-amber-500/30 rounded-lg px-2 py-1.5 bg-amber-500/10">
                  {ghActivity.zeroActivityTip}
                </p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Startups</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {collabDisplay}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Approved</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-400">
                    {approvedContributions}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-400">Collab level</p>
                  <p className="mt-1 text-sm font-semibold text-indigo-300">
                    {profile?.collaborationLevel || "Bronze"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Middle row: Startup explorer + Job/Internship card + Rewards */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Startup Explorer (2 cols) */}
            <section className="xl:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-100">
                    Startup Explorer
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Discover startups and their open‑source projects.
                  </p>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => navigate("/student/explore")}
                    className="px-3 py-1 rounded-full bg-sky-600/30 text-sky-200 border border-sky-500/40 hover:bg-sky-600/40"
                  >
                    View all startups
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                {startupCards.length === 0 && (
                  <div className="md:col-span-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 py-8 px-4 text-center text-slate-400">
                    No startups in the directory yet. When founders register as
                    Startup and save their company profile, they appear here.
                  </div>
                )}
                {startupCards.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 hover:bg-slate-800 cursor-pointer"
                  >
                    <p className="text-[11px] font-semibold text-slate-100">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {s.role} • {s.type}
                    </p>
                    {s.stipend && (
                      <p className="mt-1 text-[11px] text-slate-300">
                        {s.stipend}
                      </p>
                    )}
                    {s.description && (
                      <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                    {s.reward && (
                      <p className="mt-1 text-[11px] text-emerald-300">
                        Reward: {s.reward}
                      </p>
                    )}
                    {s.githubUrl && (
                      <a
                        href={s.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-[11px] text-sky-300 font-medium"
                      >
                        View GitHub repo →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Rewards & offers */}
            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 flex flex-col backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-100">
                  Rewards & Offers
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/student/contributions")}
                  className="text-[11px] text-sky-300 font-medium"
                >
                  View all
                </button>
              </div>
              <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-violet-500 text-white p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-sky-100 mb-1">
                    Swag Box
                  </p>
                  <p className="text-sm font-semibold">
                    Win goodies for high contribution score
                  </p>
                  <p className="mt-1 text-[11px] text-sky-100/90">
                    Custom t‑shirt, laptop stickers & exclusive startup
                    sessions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClaimReward}
                  className="mt-3 w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white text-indigo-600 hover:bg-slate-100"
                >
                  Claim Reward
                </button>
              </div>
            </section>
          </div>

          {/* Bottom row: Student analytics + collaboration count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="md:col-span-2 bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-100">
                  Student Analytics
                </p>
                <span className="text-[11px] text-slate-500">
                  Last 6 months
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Running total of points awarded by startups when your contributions
                are approved (last 6 months).
              </p>
              <div className="rounded-xl bg-slate-950/50 border border-slate-700/80 px-1 pt-1 pb-0">
                <StartupPointsLineChart
                  data={startupPointsChartData}
                  loading={contributions === null}
                />
              </div>
            </section>

            <section className="bg-slate-900/70 rounded-2xl shadow-xl border border-slate-700/70 p-5 backdrop-blur">
              <p className="text-xs font-semibold text-slate-100 mb-1">
                Startup Collaborations
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {collabDisplay} startups
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Platform approvals + GitHub-linked startup repos you contributed to (30d).
              </p>
              <button
                type="button"
                onClick={() => navigate("/student/contributions")}
                className="mt-3 text-[11px] text-sky-300 font-medium"
              >
                View contribution history →
              </button>
            </section>
          </div>
    </>
  );
}

