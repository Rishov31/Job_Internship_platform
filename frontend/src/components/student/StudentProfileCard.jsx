import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function formatRelativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const AVAILABILITY_LABEL = {
  available: "Available",
  open: "Open to opportunities",
  interviewing: "Interviewing",
  not_looking: "Not looking",
};

const AVAILABILITY_DOT = {
  available: "bg-emerald-400",
  open: "bg-sky-400",
  interviewing: "bg-amber-400",
  not_looking: "bg-slate-500",
};

const DEFAULT_PROFICIENCY = [92, 86, 78, 68];

function buildProficiencyRows(profile) {
  const explicit = profile?.skillProficiency;
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit
      .filter((r) => r?.name && typeof r.percent === "number")
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        percent: Math.min(100, Math.max(0, r.percent)),
        estimated: false,
      }));
  }
  const tech = profile?.skills?.technical || [];
  return tech.slice(0, 4).map((name, i) => ({
    name,
    percent: DEFAULT_PROFICIENCY[i] ?? 65,
    estimated: true,
  }));
}

function buildActivityItems(contributions, ghActivity) {
  const items = [];
  const seen = new Set();
  for (const c of contributions || []) {
    if (items.length >= 4) break;
    const id = String(c._id || "");
    if (seen.has(id)) continue;
    seen.add(id);
    const startup = c.startup?.name || "Startup";
    const st = c.status;
    let text = "";
    if (st === "approved") text = `Contribution approved · ${startup}`;
    else if (st === "pending") text = `Contribution pending · ${startup}`;
    else text = `Contribution ${st} · ${startup}`;
    const at = c.updatedAt || c.createdAt;
    items.push({
      key: id || text,
      text,
      at,
      tone: st === "approved" ? "emerald" : st === "pending" ? "sky" : "rose",
    });
  }
  if (items.length < 4 && ghActivity?.weeklyInsight?.message) {
    items.push({
      key: "gh-insight",
      text:
        ghActivity.weeklyInsight.message.slice(0, 80) +
        (ghActivity.weeklyInsight.message.length > 80 ? "…" : ""),
      at: new Date().toISOString(),
      tone: "violet",
    });
  }
  return items.slice(0, 4);
}

export default function StudentProfileCard({
  profile,
  displayName,
  initial,
  completion,
  contributionScore,
  approvedContributions,
  contributions,
  ghActivity,
}) {
  const navigate = useNavigate();
  const p = profile || {};

  const title =
    p?.professionalInfo?.currentTitle?.trim() || "Add your role or program";

  const availability = p?.professionalInfo?.availabilityStatus || "available";
  const availLabel = AVAILABILITY_LABEL[availability] || "Available";
  const dotClass = AVAILABILITY_DOT[availability] || "bg-emerald-400";

  const years = Number(p?.professionalInfo?.yearsOfExperience);
  const expDisplay =
    Number.isFinite(years) && years > 0
      ? years >= 10
        ? `${years}+`
        : String(years)
      : null;

  const projectsCount = Math.max(
    0,
    Number(approvedContributions) || 0,
    Array.isArray(p?.experience) ? p.experience.length : 0
  );

  const proficiencyRows = useMemo(
    () => buildProficiencyRows(profile || {}),
    [profile]
  );

  const activityItems = useMemo(
    () => buildActivityItems(contributions, ghActivity),
    [contributions, ghActivity]
  );

  const avatarUrl = p?.personalInfo?.profilePicture;

  const barTone = (pct) => {
    if (pct >= 85) return "from-violet-500 to-fuchsia-500";
    if (pct >= 70) return "from-emerald-500 to-teal-500";
    return "from-amber-500 to-orange-500";
  };

  return (
    <section className="rounded-2xl border border-slate-700/90 bg-[#12151c] shadow-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-800/90 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-violet-500/30 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-violet-900/40 shrink-0">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-base font-semibold text-white truncate leading-tight">{displayName}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{title}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
              <span className="text-[11px] text-slate-300">{availLabel}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/jobseeker/profile")}
          className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-600 text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:border-slate-500"
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-px bg-slate-800/80 border-b border-slate-800/90">
        <div className="bg-[#12151c] px-3 py-3 text-center">
          <p className="text-[9px] font-semibold tracking-wider text-slate-500 uppercase">Contribution</p>
          <p className="mt-1 text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent tabular-nums">
            {contributionScore}
          </p>
          <p className="text-[10px] text-slate-500">points</p>
        </div>
        <div className="bg-[#12151c] px-3 py-3 text-center">
          <p className="text-[9px] font-semibold tracking-wider text-slate-500 uppercase">Projects</p>
          <p className="mt-1 text-xl font-bold text-emerald-400 tabular-nums">{projectsCount}</p>
          <p className="text-[10px] text-slate-500">completed</p>
        </div>
        <div className="bg-[#12151c] px-3 py-3 text-center">
          <p className="text-[9px] font-semibold tracking-wider text-slate-500 uppercase">Experience</p>
          <p className="mt-1 text-xl font-bold text-amber-400 tabular-nums">{expDisplay ?? "—"}</p>
          <p className="text-[10px] text-slate-500">years</p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-800/90">
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="text-slate-400">▣</span> Technical
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(p?.skills?.technical || []).length ? (
              p.skills.technical.map((skill, idx) => (
                <span
                  key={`t-${skill}-${idx}`}
                  className="px-2 py-0.5 rounded-md text-[10px] border border-indigo-500/35 bg-indigo-500/10 text-indigo-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500">Add skills in profile</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="text-slate-400">◎</span> Soft skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(p?.skills?.soft || []).length ? (
              p.skills.soft.map((skill, idx) => (
                <span
                  key={`s-${skill}-${idx}`}
                  className="px-2 py-0.5 rounded-md text-[10px] border border-amber-500/30 bg-amber-500/10 text-amber-100"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500">Add soft skills in profile</span>
            )}
          </div>
        </div>
      </div>

      {/* <div className="px-4 py-3 border-b border-slate-800/90">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Skill proficiency</p>
          {proficiencyRows.some((r) => r.estimated) && (
            <span className="text-[9px] text-slate-600">Estimates — set in profile</span>
          )}
        </div>
        <div className="space-y-2.5">
          {proficiencyRows.length === 0 ? (
            <p className="text-[10px] text-slate-500">
              Add technical skills & proficiency in your profile.
            </p>
          ) : (
            proficiencyRows.map((row) => (
              <div key={row.name} className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300 truncate pr-2">{row.name}</span>
                  <span className="text-slate-500 tabular-nums">{row.percent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barTone(row.percent)}`}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div> */}

      <div className="px-4 py-3 border-b border-slate-800/90 flex-1 min-h-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent activity</p>
        {activityItems.length === 0 ? (
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Activity from contributions and GitHub will appear here. Contribute to a startup repo or update your
            profile.
          </p>
        ) : (
          <ul className="space-y-2">
            {activityItems.map((item) => (
              <li key={item.key} className="flex gap-2 text-[10px] leading-snug">
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    item.tone === "emerald"
                      ? "bg-emerald-400"
                      : item.tone === "sky"
                        ? "bg-sky-400"
                        : item.tone === "violet"
                          ? "bg-violet-400"
                          : "bg-rose-400"
                  }`}
                />
                <div className="flex-1 min-w-0 flex justify-between gap-2">
                  <span className="text-slate-300">{item.text}</span>
                  <span className="text-slate-600 shrink-0 tabular-nums">{formatRelativeTime(item.at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 mt-auto bg-slate-950/40">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Profile completion</span>
          <span>{completion?.completionPercentage ?? 0}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
            style={{ width: `${completion?.completionPercentage ?? 0}%` }}
          />
        </div>
      </div>
    </section>
  );
}
