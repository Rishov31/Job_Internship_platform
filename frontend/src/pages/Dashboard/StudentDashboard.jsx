import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import ContributionGithubChart from "../../components/ContributionGithubChart";
import StartupPointsLineChart from "../../components/StartupPointsLineChart";
import ContributorLeaderboard from "../../components/ContributorLeaderboard";
import StudentProfileCard from "../../components/student/StudentProfileCard";
import { chatWithAiCoach } from "../../api/aiCoachApi";
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

function mentorDisplayName(session) {
  const u = session?.mentorUser;
  if (u && typeof u === "object" && u.fullName) return u.fullName;
  const nested = session?.mentor?.user;
  if (nested && typeof nested === "object" && nested.fullName) return nested.fullName;
  if (session?.sessionKind === "startup_founder" && session?.providerStartup?.name) {
    return session.providerStartup.name;
  }
  return "Mentor";
}

function sessionCardTitle(session) {
  const name = mentorDisplayName(session);
  if (session?.sessionKind === "startup_founder") {
    return `Mentoring Session with ${name}`;
  }
  if (session?.sessionKind === "investor") {
    return `Mentoring Session with ${name}`;
  }
  return `Mentoring Session with ${name}`;
}

function formatSessionCardWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const wk = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const mon = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNum = d.getDate();
  const time = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
  return `${wk}, ${mon} ${dayNum} @${time}`;
}

function getSessionCountdown(iso) {
  const start = new Date(iso);
  const now = new Date();
  const ms = start.getTime() - now.getTime();
  const dayMs = 86400000;
  if (ms < 0) {
    const daysPast = Math.ceil(-ms / dayMs);
    return {
      text: daysPast <= 0 ? "Today" : `-${daysPast} Day${daysPast === 1 ? "" : "s"} Left`,
      overdue: true,
    };
  }
  const days = Math.floor(ms / dayMs);
  const hours = Math.floor((ms % dayMs) / 3600000);
  if (days > 0) {
    return {
      text: `${days} Day${days === 1 ? "" : "s"} Left`,
      overdue: days <= 1,
    };
  }
  if (hours > 0) {
    return { text: `${hours} Hour${hours === 1 ? "" : "s"} Left`, overdue: true };
  }
  const mins = Math.floor((ms % 3600000) / 60000);
  return {
    text: mins > 0 ? `${mins} min Left` : "Starting soon",
    overdue: true,
  };
}

function pickUpcomingMentoringSessions(sessions) {
  const now = new Date();
  return (sessions || [])
    .filter((s) => {
      if (!s?.startTime) return false;
      const st = s.status;
      if (st !== "paid" && st !== "scheduled") return false;
      const t = new Date(s.startTime);
      return !Number.isNaN(t.getTime()) && t >= now;
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 10);
}

function isInterviewStageApplication(a) {
  return (
    a.status === "interview" ||
    Boolean(a.metadata?.interview) ||
    Boolean(a.metadata?.interviewSessionId)
  );
}

/** Parse scheduled job interview time for ordering / countdown */
function jobInterviewWhenIso(app) {
  const iv = app.metadata?.interview;
  if (!iv?.date) return null;
  const raw = iv.time ? `${iv.date} ${iv.time}` : iv.date;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function jobInterviewSortKey(app) {
  const iso = jobInterviewWhenIso(app);
  if (iso) return new Date(iso).getTime();
  return new Date(app.updatedAt || app.appliedAt || app.createdAt || 0).getTime();
}

function pickUpcomingJobInterviews(applications) {
  return (applications || [])
    .filter(isInterviewStageApplication)
    .sort((a, b) => jobInterviewSortKey(a) - jobInterviewSortKey(b))
    .slice(0, 10);
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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am your AI Career Coach. Ask me for role suggestions, performance feedback, or a focused improvement plan.",
    },
  ]);
  /** null until first load of /contributions/student/me */
  const [contributions, setContributions] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [mentoringSessions, setMentoringSessions] = useState([]);
  const [mentoringSessionsLoading, setMentoringSessionsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const processedMentoringCheckoutRef = useRef(new Set());

  const refreshMentoringSessions = useCallback(() => {
    const headers = { ...authHeader() };
    return fetch("/api/mentoring-sessions/me", {
      headers,
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setMentoringSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      })
      .catch(() => setMentoringSessions([]));
  }, []);

  const startupPointsChartData = useMemo(
    () => buildMonthlyStartupPointsSeries(contributions || []),
    [contributions]
  );

  const upcomingMentoringSessions = useMemo(
    () => pickUpcomingMentoringSessions(mentoringSessions),
    [mentoringSessions]
  );

  const upcomingJobInterviews = useMemo(
    () => pickUpcomingJobInterviews(applications),
    [applications]
  );

  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;
    const API_BASE = "/api";
    const headers = { ...authHeader() };
    setApplicationsLoading(true);

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

      fetch(`${API_BASE}/jobseeker/applications`, {
        headers,
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          setApplications(Array.isArray(data?.applications) ? data.applications : []);
        })
        .catch(() => {
          if (!cancelled) setApplications([]);
        })
        .finally(() => {
          if (!cancelled) setApplicationsLoading(false);
        });

      refreshMentoringSessions().finally(() => {
        if (!cancelled) setMentoringSessionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, navigate, refreshMentoringSessions]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const paymentState = q.get("payment");
    const sessionId = q.get("sessionId");
    const checkoutSessionId = q.get("checkoutSessionId");
    if (paymentState === "mentoring_success" && sessionId && checkoutSessionId) {
      if (processedMentoringCheckoutRef.current.has(checkoutSessionId)) return;
      processedMentoringCheckoutRef.current.add(checkoutSessionId);
      const token = localStorage.getItem("token");
      fetch(`/api/payments/mentoring/${sessionId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ checkoutSessionId }),
      })
        .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (!ok) throw new Error(d?.message || "Payment confirmation failed");
          return refreshMentoringSessions();
        })
        .then(() => {
          window.alert("Payment successful! Your mentorship session is booked.");
          navigate("/student/dashboard", { replace: true });
        })
        .catch((e) => {
          window.alert(e.message || "Payment confirmation failed");
          navigate("/student/dashboard", { replace: true });
        });
    } else if (paymentState === "mentoring_cancelled") {
      window.alert("Payment was cancelled. You can retry from Mentorship.");
      navigate("/student/dashboard", { replace: true });
    }
  }, [location.search, navigate, refreshMentoringSessions]);

  if (!authUser) return null;

  const displayName = studentDisplayName(profile, authUser);
  const initial = (displayName || "S").trim().charAt(0).toUpperCase();
  const githubStartupCount = Number(ghActivity?.githubStartupCount || 0);
  const collabDisplay = Math.max(Number(collaborations || 0), githubStartupCount);

  const handleAiSend = async () => {
    const message = aiInput.trim();
    if (!message || aiLoading) return;
    setAiError("");
    setAiInput("");

    const nextMessages = [...aiMessages, { role: "user", content: message }];
    setAiMessages(nextMessages);
    setAiLoading(true);
    try {
      const history = nextMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const data = await chatWithAiCoach({ message, history });
      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "I could not generate a response." },
      ]);
    } catch (e) {
      setAiError(e.message || "Unable to reach AI coach");
    } finally {
      setAiLoading(false);
    }
  };

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
          {/* Top: compact profile + contribution tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
            <section className="lg:col-span-5 min-h-0">
              <StudentProfileCard
                profile={profile}
                displayName={displayName}
                initial={initial}
                completion={completion}
                contributionScore={contributionScore}
                approvedContributions={approvedContributions}
                contributions={Array.isArray(contributions) ? contributions : []}
                ghActivity={ghActivity}
              />
            </section>

            <section className="lg:col-span-7 bg-slate-900/70 rounded-2xl shadow-lg border border-slate-700/70 p-4 backdrop-blur">
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <p className="text-xs font-semibold text-slate-100">
                  Contribution Tracker
                </p>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-400 font-medium">
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
              <p className="text-[10px] text-slate-500 mb-2 leading-snug">
                Commits + merged PRs on linked startup repos (all branches).
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
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-500">Startups</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-100 tabular-nums">
                    {collabDisplay}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-500">Approved</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-400 tabular-nums">
                    {approvedContributions}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2">
                  <p className="text-slate-500">Collab</p>
                  <p className="mt-0.5 text-sm font-semibold text-indigo-300">
                    {profile?.collaborationLevel || "Bronze"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <ContributorLeaderboard currentUserId={authUser?.id} compact />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Ongoing mentorship sessions */}
            <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 sm:p-5 backdrop-blur shadow-xl min-h-0 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                  Ongoing Info Sessions
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("/student/mentorship")}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  Mentorship hub →
                </button>
              </div>

              {mentoringSessionsLoading ? (
                <p className="text-sm text-slate-500 py-6 text-center">Loading sessions…</p>
              ) : upcomingMentoringSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-600/80 bg-slate-950/40 px-4 py-8 text-center flex-1 flex flex-col justify-center">
                  <p className="text-sm text-slate-300 font-medium">No upcoming sessions</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    When you book and pay for a mentorship slot, it will show here with date and time.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/student/mentorship")}
                    className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 border border-sky-500/40 mx-auto"
                  >
                    Book a session
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 pt-1 -mx-1 px-1 scrollbar-thin [scrollbar-color:rgba(100,116,139,0.5)_transparent] flex-1">
                  {upcomingMentoringSessions.map((session) => {
                    const cd = getSessionCountdown(session.startTime);
                    const when = formatSessionCardWhen(session.startTime);
                    const title = sessionCardTitle(session);
                    return (
                      <article
                        key={session._id}
                        className="min-w-[248px] max-w-[260px] shrink-0 rounded-xl border border-slate-700/90 bg-slate-950/50 p-4 shadow-inner flex flex-col"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-rose-400">
                          <svg
                            className="w-4 h-4 shrink-0 text-rose-400/90"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{cd.text}</span>
                        </div>
                        <p className="mt-3 text-sm font-bold text-slate-50 leading-snug">{when}</p>
                        <p className="mt-2 text-sm text-slate-400 leading-snug line-clamp-2">
                          {title}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">Online Session</p>
                        <button
                          type="button"
                          onClick={() => navigate("/jobseeker/mentor-chats")}
                          className="mt-4 w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold border border-sky-500/40 shadow-lg shadow-sky-900/20 transition-colors"
                        >
                          Attend
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Job interviews — same shell as info sessions */}
            <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 sm:p-5 backdrop-blur shadow-xl min-h-0 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                  Upcoming Interview
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("/student/applications")}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  Applications →
                </button>
              </div>

              {applicationsLoading ? (
                <p className="text-sm text-slate-500 py-6 text-center">Loading interviews…</p>
              ) : upcomingJobInterviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-600/80 bg-slate-950/40 px-4 py-8 text-center flex-1 flex flex-col justify-center">
                  <p className="text-sm text-slate-300 font-medium">No upcoming interviews</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    When an employer schedules an interview for your application, it will show here with date and
                    time.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/jobseeker/jobs")}
                    className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 border border-sky-500/40 mx-auto"
                  >
                    Browse jobs
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 pt-1 -mx-1 px-1 scrollbar-thin [scrollbar-color:rgba(100,116,139,0.5)_transparent] flex-1">
                  {upcomingJobInterviews.map((app) => {
                    const whenIso = jobInterviewWhenIso(app);
                    const cd = whenIso
                      ? getSessionCountdown(whenIso)
                      : { text: "Interview", overdue: false };
                    const when = whenIso
                      ? formatSessionCardWhen(whenIso)
                      : "Date & time in Applications";
                    const roleTitle = app.job?.title || "Interview";
                    const company = app.job?.company || "Employer";
                    const title = `${roleTitle} · ${company}`;
                    const loc =
                      app.metadata?.interview?.location ||
                      (app.metadata?.interviewSessionId ? "Coding interview" : "See Applications");
                    return (
                      <article
                        key={app._id}
                        className="min-w-[248px] max-w-[260px] shrink-0 rounded-xl border border-slate-700/90 bg-slate-950/50 p-4 shadow-inner flex flex-col"
                      >
                        <div
                          className={`flex items-center gap-2 text-sm font-medium ${
                            cd.overdue ? "text-violet-400" : "text-violet-300/90"
                          }`}
                        >
                          <svg
                            className="w-4 h-4 shrink-0 text-violet-400/90"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{cd.text}</span>
                        </div>
                        <p className="mt-3 text-sm font-bold text-slate-50 leading-snug">{when}</p>
                        <p className="mt-2 text-sm text-slate-400 leading-snug line-clamp-2">{title}</p>
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{loc}</p>
                        <button
                          type="button"
                          onClick={() =>
                            app.metadata?.interviewSessionId
                              ? navigate(`/interview/coding/${app.metadata.interviewSessionId}`)
                              : navigate("/student/applications")
                          }
                          className="mt-4 w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold border border-sky-500/40 shadow-lg shadow-sky-900/20 transition-colors"
                        >
                          {app.metadata?.interviewSessionId ? "Join interview" : "View details"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => navigate("/student/mentorship")}
              className="group text-left rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 hover:border-sky-500/45 hover:bg-slate-900/90 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/20 text-lg border border-slate-600/50">
                  🎓
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100">Mentorship hub</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Request founders & investors, pay, chat, and join video calls.
                  </p>
                </div>
              </div>
              <span className="mt-3 inline-flex text-[11px] font-medium text-sky-400 group-hover:text-sky-300">
                Open full mentorship →
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/student/resources")}
              className="group text-left rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 hover:border-emerald-500/45 hover:bg-slate-900/90 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-cyan-500/15 text-lg border border-slate-600/50">
                  📚
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100">Career Resources</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Guides, templates, and paths for interviews and skill growth.
                  </p>
                </div>
              </div>
              <span className="mt-3 inline-flex text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300">
                Browse resources →
              </span>
            </button>
          </div>

          {/* Startup explorer + Rewards */}
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
      <button
        type="button"
        onClick={() => setAiOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg border border-violet-400/30"
      >
        {aiOpen ? "Close AI Coach" : "AI Career Coach"}
      </button>

      {aiOpen && (
        <section className="fixed bottom-20 right-6 z-40 w-[min(28rem,92vw)] h-[32rem] rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90">
            <p className="text-sm font-semibold text-slate-100">AI Career Coach</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Personalized advice using your profile, applications, and contribution metrics.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {aiMessages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}`}
                className={`rounded-xl px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed ${
                  m.role === "assistant"
                    ? "bg-slate-800/90 border border-slate-700 text-slate-100"
                    : "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 ml-8"
                }`}
              >
                {m.content}
              </div>
            ))}
            {aiLoading && (
              <div className="rounded-xl px-3 py-2 text-xs bg-slate-800/90 border border-slate-700 text-slate-300">
                Thinking...
              </div>
            )}
          </div>

          {aiError && (
            <p className="px-3 py-2 text-[11px] text-red-300 border-t border-red-500/20 bg-red-500/10">
              {aiError}
            </p>
          )}

          <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAiSend();
                }
              }}
              placeholder="Ask for career suggestions or performance feedback..."
              rows={2}
              className="flex-1 resize-none text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={handleAiSend}
              disabled={aiLoading || !aiInput.trim()}
              className="self-end px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-semibold"
            >
              Send
            </button>
          </div>
        </section>
      )}
    </>
  );
}

