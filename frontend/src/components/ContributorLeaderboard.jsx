import React, { useCallback, useEffect, useState } from "react";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function rankMedal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

/**
 * Top contributors leaderboard (commits on linked startup repos + platform points).
 * @param {string} [apiBase]
 * @param {string} [currentUserId] - highlight row when viewing as student
 */
export default function ContributorLeaderboard({
  apiBase = "/api",
  currentUserId,
  compact = false,
}) {
  const [entries, setEntries] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [meta, setMeta] = useState({});
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh) => {
    setError("");
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const qs = refresh ? "?refresh=true" : "";
      const res = await fetch(`${apiBase}/contributions/leaderboard${qs}`, {
        headers: { ...authHeader() },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to load leaderboard");
      }
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setGeneratedAt(data.generatedAt ? new Date(data.generatedAt) : null);
      setFromCache(!!data.fromCache);
      setMeta(data.meta || {});
      setWindowDays(typeof data.windowDays === "number" ? data.windowDays : 30);
    } catch (e) {
      setError(e.message || "Failed to load");
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <section
      className={`rounded-2xl border border-amber-500/25 bg-slate-900/70 backdrop-blur shadow-xl ${
        compact ? "mb-4 p-4" : "mb-6 p-5"
      }`}
    >
      <div
        className={`flex flex-wrap items-start justify-between gap-3 ${compact ? "mb-3" : "mb-4"}`}
      >
        <div>
          <p className="text-[10px] font-semibold text-amber-200/90 uppercase tracking-wider">
            Leaderboard
          </p>
          <h2 className="text-sm font-semibold text-slate-100 mt-0.5">
            🏆 Top Contributors
          </h2>
          <p
            className={`text-[11px] text-slate-400 mt-1 max-w-xl ${compact ? "line-clamp-2" : ""}`}
          >
            Ranked by GitHub commits & merged PRs on tracked startup repos (last{" "}
            {windowDays} days), then platform points. League = collaboration tier;
            Activity = GitHub volume tier.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing || loading}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh rankings"}
          </button>
          {generatedAt && (
            <span className="text-[10px] text-slate-500">
              Updated {generatedAt.toLocaleString()}
              {fromCache ? " · cached" : ""}
            </span>
          )}
        </div>
      </div>

      {meta?.message ? (
        <p className="text-[11px] text-amber-200/80 mb-3 border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
          {meta.message}
        </p>
      ) : null}

      {error && (
        <p className="text-[11px] text-red-400 mb-3">{error}</p>
      )}

      {loading ? (
        <p className="text-[11px] text-slate-500 py-8 text-center">Loading leaderboard…</p>
      ) : entries.length === 0 ? (
        <p className="text-[11px] text-slate-500 py-6 text-center">
          No students to rank yet.
        </p>
      ) : (
        <div>
          <p className="text-[10px] text-slate-500 mb-2">
            Showing ranked list ({entries.length} student{entries.length === 1 ? "" : "s"}). Scroll for more.
          </p>
          <div
            className={`overflow-x-auto overflow-y-auto rounded-xl border border-slate-700/80 ${
              compact ? "max-h-[min(16rem,45vh)]" : "max-h-[min(28rem,70vh)]"
            }`}
          >
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-700 bg-slate-950/95 text-slate-400">
                <th className="py-2.5 px-3 font-medium">Rank</th>
                <th className="py-2.5 px-3 font-medium">Student</th>
                <th className="py-2.5 px-3 font-medium whitespace-nowrap">Commits (est.)</th>
                <th className="py-2.5 px-3 font-medium">Points</th>
                <th className="py-2.5 px-3 font-medium">League</th>
                <th className="py-2.5 px-3 font-medium">Activity</th>
                <th className="py-2.5 px-3 font-medium min-w-[180px]">Companies</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => {
                const isMe =
                  currentUserId &&
                  String(row.userId || row.user?._id || "") === String(currentUserId);
                return (
                  <tr
                    key={String(row.userId)}
                    className={`border-b border-slate-800/80 ${
                      isMe ? "bg-indigo-500/15" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-200">
                      {rankMedal(row.rank)} <span className="text-slate-400">{row.rank}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-100">{row.fullName || "—"}</div>
                      {row.githubUsername ? (
                        <div className="text-[10px] text-slate-500">@{row.githubUsername}</div>
                      ) : (
                        <div className="text-[10px] text-slate-600">No GitHub linked</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-sky-300 font-semibold tabular-nums">
                      {row.totalCommits ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-300/90 tabular-nums">
                      {row.platformPoints ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-violet-300">{row.league || "—"}</td>
                    <td className="py-2.5 px-3 text-amber-200/90">{row.githubLeague || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-400 leading-snug">
                      {(row.companyNames && row.companyNames.length > 0
                        ? row.companyNames
                        : row.startups?.map((s) => s.name).filter(Boolean) || []
                      ).slice(0, 8).join(", ")}
                      {(row.companyNames?.length || row.startups?.length || 0) > 8 ? "…" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  );
}
