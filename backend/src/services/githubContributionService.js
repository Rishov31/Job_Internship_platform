const axios = require("axios");

const GITHUB_API = "https://api.github.com";

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "HireTalent-Ecosystem/1.0",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Parse https://github.com/owner/repo or .../repo.git
 */
function parseGithubRepoUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  const m = s.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  const repo = m[2].replace(/\.git$/i, "").replace(/\/$/, "");
  return { owner: m[1], repo };
}

const MAX_BRANCHES_DEFAULT = parseInt(
  process.env.GITHUB_MAX_BRANCHES_PER_REPO || "25",
  10
);
const MAX_PAGES_PER_BRANCH = parseInt(
  process.env.GITHUB_MAX_PAGES_PER_BRANCH || "4",
  10
);

/** Prefer default-like branches first, then keep API order (up to `max`). */
function prioritizeBranchNames(names, max) {
  if (!Array.isArray(names) || !names.length) return [];
  const preferred = ["main", "master", "develop", "dev", "staging", "release"];
  const out = [];
  const used = new Set();
  for (const p of preferred) {
    if (names.includes(p) && !used.has(p)) {
      out.push(p);
      used.add(p);
    }
  }
  for (const n of names) {
    if (!used.has(n)) {
      out.push(n);
      used.add(n);
      if (out.length >= max) break;
    }
  }
  return out;
}

/**
 * GitHub "List commits" only walks the default branch unless you pass `sha` (branch/tag).
 * This loads branch tips, then fetches commits per branch for the given author — deduped by SHA.
 */
async function fetchCommitsForAuthorAcrossBranches(
  owner,
  repo,
  githubUsername,
  sinceIso,
  options = {}
) {
  const maxBranches = Math.min(
    Number(options.maxBranches) || MAX_BRANCHES_DEFAULT,
    50
  );
  const maxPages = Math.min(Number(options.maxPagesPerBranch) || MAX_PAGES_PER_BRANCH, 10);
  const headers = githubHeaders();
  const seenSha = new Set();
  const out = [];

  async function pullBranch(shaRef) {
    let page = 1;
    while (page <= maxPages) {
      try {
        const params = {
          author: githubUsername,
          since: sinceIso,
          per_page: 100,
          page,
        };
        if (shaRef) params.sha = shaRef;

        const { data } = await axios.get(
          `${GITHUB_API}/repos/${owner}/${repo}/commits`,
          { headers, params, timeout: 15000 }
        );
        if (!Array.isArray(data) || !data.length) break;
        for (const c of data) {
          if (c.sha && !seenSha.has(c.sha)) {
            seenSha.add(c.sha);
            out.push(c);
          }
        }
        if (data.length < 100) break;
        page += 1;
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 403) break;
        throw e;
      }
    }
  }

  let branchNames = [];
  try {
    const { data } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/branches`,
      {
        headers,
        params: { per_page: 100, page: 1 },
        timeout: 15000,
      }
    );
    const raw = Array.isArray(data) ? data.map((b) => b.name).filter(Boolean) : [];
    branchNames = prioritizeBranchNames(raw, maxBranches);
  } catch (e) {
    if (e.response?.status !== 404 && e.response?.status !== 403) {
      // eslint-disable-next-line no-console
      console.warn(`Branches list ${owner}/${repo}:`, e.message);
    }
  }

  if (!branchNames.length) {
    await pullBranch(undefined);
    return out;
  }

  for (const name of branchNames) {
    await pullBranch(name);
  }

  return out;
}

/**
 * All recent commits (any author) across branches — for startup contributor leaderboard.
 */
async function fetchRecentCommitsAcrossBranches(owner, repo, sinceIso, options = {}) {
  const maxBranches = Math.min(
    Number(options.maxBranches) || 12,
    30
  );
  const maxPages = Math.min(Number(options.maxPagesPerBranch) || 2, 5);
  const headers = githubHeaders();
  const seenSha = new Set();
  const out = [];

  async function pullBranch(shaRef) {
    let page = 1;
    while (page <= maxPages) {
      try {
        const params = { since: sinceIso, per_page: 100, page };
        if (shaRef) params.sha = shaRef;
        const { data } = await axios.get(
          `${GITHUB_API}/repos/${owner}/${repo}/commits`,
          { headers, params, timeout: 15000 }
        );
        if (!Array.isArray(data) || !data.length) break;
        for (const c of data) {
          if (c.sha && !seenSha.has(c.sha)) {
            seenSha.add(c.sha);
            out.push(c);
          }
        }
        if (data.length < 100) break;
        page += 1;
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 403) break;
        throw e;
      }
    }
  }

  let branchNames = [];
  try {
    const { data } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/branches`,
      {
        headers,
        params: { per_page: 100, page: 1 },
        timeout: 15000,
      }
    );
    const raw = Array.isArray(data) ? data.map((b) => b.name).filter(Boolean) : [];
    branchNames = prioritizeBranchNames(raw, maxBranches);
  } catch {
    branchNames = [];
  }

  if (!branchNames.length) {
    await pullBranch(undefined);
    return out;
  }
  for (const name of branchNames) {
    await pullBranch(name);
  }
  return out;
}

async function fetchPullRequestsForRepo(owner, repo) {
  const headers = githubHeaders();
  let page = 1;
  const all = [];
  while (page <= 5) {
    try {
      const { data } = await axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/pulls`,
        {
          headers,
          params: {
            state: "all",
            per_page: 100,
            page,
            sort: "updated",
            direction: "desc",
          },
          timeout: 15000,
        }
      );
      if (!Array.isArray(data) || !data.length) break;
      all.push(...data);
      if (data.length < 100) break;
      page += 1;
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status === 403) break;
      throw e;
    }
  }
  return all;
}

function aggregateByDate(map, isoDateStr, increment = 1) {
  if (!isoDateStr) return;
  const day = isoDateStr.split("T")[0];
  if (!day) return;
  map[day] = (map[day] || 0) + increment;
}

function contributionLevel(total30d) {
  if (total30d >= 150) return { level: "Gold", tier: "gold" };
  if (total30d >= 50) return { level: "Silver", tier: "silver" };
  return { level: "Bronze", tier: "bronze" };
}

function computeStreak(byDate, endDate) {
  let streak = 0;
  const d = new Date(endDate);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i += 1) {
    const key = d.toISOString().split("T")[0];
    if ((byDate[key] || 0) > 0) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Sum contributions in a rolling window of `days` ending `endOffset` days ago from today */
function sumRollingDays(byDate, days, endOffset) {
  let total = 0;
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - endOffset);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    total += byDate[key] || 0;
  }
  return total;
}

/**
 * Build list of { startupId, startupName, owner, repo } from Startup docs (deduped by owner/repo)
 */
function collectReposFromStartups(startups, maxRepos) {
  const seen = new Set();
  const out = [];
  for (const s of startups) {
    const startupId = String(s._id);
    const startupName = s.name || "Startup";
    const urls = [];
    if (s.githubUrl) urls.push(s.githubUrl);
    for (const gr of s.githubRepos || []) {
      if (gr?.url) urls.push(gr.url);
    }
    for (const u of urls) {
      const parsed = parseGithubRepoUrl(u);
      if (!parsed) continue;
      const key = `${parsed.owner}/${parsed.repo}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        startupId,
        startupName,
        owner: parsed.owner,
        repo: parsed.repo,
      });
      if (out.length >= maxRepos) return out;
    }
  }
  return out;
}

/**
 * Student: aggregate commits + merged PRs by user across platform startup repos
 */
async function getStudentGithubActivity(githubUsername, options = {}) {
  const maxRepos = Math.min(Number(options.maxRepos) || 18, 40);
  const days = Math.min(Number(options.days) || 30, 90);

  const Startup = require("../models/Startup");
  const startups = await Startup.find({})
    .select("name githubUrl githubRepos")
    .limit(100)
    .lean();

  const withGithub = startups.filter(
    (s) =>
      (s.githubUrl && String(s.githubUrl).trim()) ||
      (Array.isArray(s.githubRepos) && s.githubRepos.some((r) => r && r.url))
  );

  const repoList = collectReposFromStartups(withGithub, maxRepos);
  if (!repoList.length) {
    return {
      githubUsername,
      chart: [],
      weeklyInsight: null,
      streak: 0,
      level: contributionLevel(0),
      topStartup: null,
      totalCommitsAndPRs: 0,
      reposScanned: 0,
      message: "No GitHub repositories registered by startups yet.",
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const byDate = {};
  const byStartup = {};

  let reposScanned = 0;
  for (const item of repoList) {
    try {
      const commits = await fetchCommitsForAuthorAcrossBranches(
        item.owner,
        item.repo,
        githubUsername,
        sinceIso
      );
      for (const c of commits) {
        const when = c.commit?.author?.date || c.commit?.committer?.date;
        aggregateByDate(byDate, when, 1);
        byStartup[item.startupId] = (byStartup[item.startupId] || 0) + 1;
        byStartup[`_name_${item.startupId}`] = item.startupName;
      }

      const prs = await fetchPullRequestsForRepo(item.owner, item.repo);
      for (const pr of prs) {
        if ((pr.user?.login || "").toLowerCase() !== githubUsername.toLowerCase()) {
          continue;
        }
        const when = pr.merged_at || pr.created_at;
        if (!when) continue;
        const prDate = new Date(when);
        if (prDate < since) continue;
        aggregateByDate(byDate, when, 1);
        byStartup[item.startupId] = (byStartup[item.startupId] || 0) + 1;
        byStartup[`_name_${item.startupId}`] = item.startupName;
      }
      reposScanned += 1;
    } catch (e) {
      // skip repo on error
      // eslint-disable-next-line no-console
      console.warn(`GitHub repo ${item.owner}/${item.repo}:`, e.message);
    }
  }

  const total = Object.values(byDate).reduce((a, b) => a + b, 0);

  let zeroActivityTip = null;
  if (total === 0 && reposScanned > 0) {
    zeroActivityTip =
      "Still zero? GitHub matches the `author` filter to your GitHub account email. Run `git config user.email` and ensure that email is added in GitHub → Settings → Emails (and verified).";
  }

  let topStartup = null;
  let topCount = 0;
  for (const sid of Object.keys(byStartup)) {
    if (sid.startsWith("_name_")) continue;
    const n = byStartup[sid] || 0;
    if (n > topCount) {
      topCount = n;
      topStartup = {
        startupId: sid,
        name: byStartup[`_name_${sid}`] || "Startup",
        count: n,
      };
    }
  }

  const chartDays = 14;
  const chart = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = chartDays - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const count = byDate[key] || 0;
    chart.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fullDate: key,
      count,
    });
  }

  const thisWeek = sumRollingDays(byDate, 7, 0);
  const lastWeek = sumRollingDays(byDate, 7, 7);
  let pctChange = null;
  if (lastWeek > 0) {
    pctChange = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  } else if (thisWeek > 0) {
    pctChange = 100;
  }

  const streak = computeStreak(byDate, now);

  const total30d = Object.entries(byDate).reduce((sum, [day, c]) => {
    const dt = new Date(day);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return dt >= cutoff ? sum + c : sum;
  }, 0);

  return {
    githubUsername,
    chart,
    weeklyInsight: {
      thisWeek,
      lastWeek,
      percentChange: pctChange,
      message:
        thisWeek === 0
          ? "No GitHub activity in tracked startup repos this week."
          : `You contributed ${thisWeek} time${thisWeek === 1 ? "" : "s"} this week${
              pctChange != null && lastWeek > 0
                ? ` (${pctChange >= 0 ? "+" : ""}${pctChange}% vs last week)`
                : ""
            }.`,
    },
    streak,
    level: contributionLevel(total30d),
    topStartup,
    totalCommitsAndPRs: total,
    reposScanned,
    zeroActivityTip,
  };
}

/**
 * Startup founder: recent commits on own repos — top external contributors (7d)
 */
async function getStartupRepoContributors(ownerUserId) {
  const Startup = require("../models/Startup");
  const startup = await Startup.findOne({ owner: ownerUserId }).lean();
  if (!startup) {
    return { repos: [], topContributors: [], recentTotal: 0 };
  }

  const repoList = collectReposFromStartups([startup], 12);
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceIso = since.toISOString();

  const authorCounts = {};

  for (const item of repoList) {
    try {
      const commits = await fetchRecentCommitsAcrossBranches(
        item.owner,
        item.repo,
        sinceIso
      );
      for (const c of commits) {
        const login =
          c.author?.login || c.commit?.author?.name || "unknown";
        if (!login || login === "web-flow") continue;
        authorCounts[login] = (authorCounts[login] || 0) + 1;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Startup repo fetch ${item.owner}/${item.repo}:`, e.message);
    }
  }

  const topContributors = Object.entries(authorCounts)
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const recentTotal = topContributors.reduce((s, x) => s + x.count, 0);

  return {
    startupName: startup.name,
    repos: repoList.map((r) => `${r.owner}/${r.repo}`),
    topContributors,
    recentTotal,
  };
}

module.exports = {
  parseGithubRepoUrl,
  getStudentGithubActivity,
  getStartupRepoContributors,
  githubHeaders,
};
