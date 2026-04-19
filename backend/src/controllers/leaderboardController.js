const User = require("../models/User");
const JobSeekerProfile = require("../models/JobSeekerProfile");
const Contribution = require("../models/Contribution");
const LeaderboardSnapshot = require("../models/LeaderboardSnapshot");
const { getStudentGithubActivity } = require("../services/githubContributionService");
const { normalizeGithubUsernameInput } = require("../utils/githubUsername");

const WINDOW_DAYS = 30;
const CACHE_MS = 45 * 60 * 1000;
const GITHUB_THROTTLE_MS = 200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeStartupRows(ghBreakdown, approvedContributions) {
  const byId = new Map();
  for (const s of ghBreakdown || []) {
    byId.set(String(s.startupId), {
      startupId: String(s.startupId),
      name: s.name || "Startup",
      commits: Number(s.commits) || 0,
      fromPlatformOnly: false,
    });
  }
  for (const c of approvedContributions || []) {
    const sid = String(c.startup?._id || c.startup || "");
    const name = c.startup?.name;
    if (!sid || !name) continue;
    if (byId.has(sid)) continue;
    byId.set(sid, {
      startupId: sid,
      name,
      commits: 0,
      fromPlatformOnly: true,
    });
  }
  return Array.from(byId.values()).sort(
    (a, b) => b.commits - a.commits || String(a.name).localeCompare(String(b.name))
  );
}

async function computeLeaderboardEntries() {
  const students = await User.find({ role: "jobseeker" })
    .select("fullName email githubUsername avatarUrl")
    .lean();

  const profiles = await JobSeekerProfile.find({}).select("user contributionScore collaborationLevel").lean();
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

  const allApproved = await Contribution.find({ status: "approved" })
    .populate("startup", "name")
    .lean();
  const approvedByStudent = new Map();
  for (const c of allApproved) {
    const sid = String(c.student);
    if (!approvedByStudent.has(sid)) approvedByStudent.set(sid, []);
    approvedByStudent.get(sid).push(c);
  }

  const raw = [];
  let withGithub = 0;

  for (const u of students) {
    const prof = profileByUser.get(String(u._id));
    const gh = normalizeGithubUsernameInput(u.githubUsername || "") || "";
    const approved = approvedByStudent.get(String(u._id)) || [];

    let activity = {
      totalCommitsAndPRs: 0,
      startupBreakdown: [],
      level: { level: "Bronze" },
      githubStartupCount: 0,
    };

    if (gh) {
      withGithub += 1;
      try {
        const emails = u.email ? [u.email] : [];
        activity = await getStudentGithubActivity(gh, {
          days: WINDOW_DAYS,
          maxRepos: 20,
          accountEmails: emails,
        });
      } catch (e) {
        activity = {
          totalCommitsAndPRs: 0,
          startupBreakdown: [],
          level: { level: "Bronze" },
          githubStartupCount: 0,
        };
      }
      await sleep(GITHUB_THROTTLE_MS);
    }

    const startups = mergeStartupRows(activity.startupBreakdown || [], approved);
    const companyNames = [...new Set(startups.map((s) => s.name).filter(Boolean))].sort();

    raw.push({
      userId: u._id,
      fullName: u.fullName || "Student",
      githubUsername: gh || null,
      avatarUrl: u.avatarUrl || null,
      totalCommits: Number(activity.totalCommitsAndPRs) || 0,
      platformPoints: Number(prof?.contributionScore) || 0,
      league: prof?.collaborationLevel || "Bronze",
      githubLeague: activity.level?.level || "Bronze",
      distinctStartupCount: startups.length,
      startups,
      companyNames,
    });
  }

  raw.sort((a, b) => {
    if (b.totalCommits !== a.totalCommits) return b.totalCommits - a.totalCommits;
    if (b.platformPoints !== a.platformPoints) return b.platformPoints - a.platformPoints;
    if (b.distinctStartupCount !== a.distinctStartupCount) {
      return b.distinctStartupCount - a.distinctStartupCount;
    }
    return String(a.fullName).localeCompare(String(b.fullName));
  });

  raw.forEach((row, i) => {
    row.rank = i + 1;
  });

  return {
    entries: raw,
    meta: {
      totalStudentsScanned: students.length,
      withGithub,
      message:
        withGithub === 0
          ? "No students have linked a GitHub username yet. Commits will show once profiles include GitHub handles."
          : "",
    },
  };
}

/**
 * GET /api/contributions/leaderboard
 * Cached snapshot (45m). Query ?refresh=true forces rebuild.
 */
exports.getContributorLeaderboard = async (req, res, next) => {
  try {
    const force = String(req.query.refresh || "") === "true";

    if (!force) {
      const recent = await LeaderboardSnapshot.findOne({
        windowDays: WINDOW_DAYS,
        generatedAt: { $gte: new Date(Date.now() - CACHE_MS) },
      })
        .sort({ generatedAt: -1 })
        .lean();

      if (recent && Array.isArray(recent.entries) && recent.entries.length) {
        return res.json({
          windowDays: recent.windowDays,
          generatedAt: recent.generatedAt,
          fromCache: true,
          entries: recent.entries,
          meta: recent.meta || {},
        });
      }
    }

    const { entries, meta } = await computeLeaderboardEntries();
    const generatedAt = new Date();

    await LeaderboardSnapshot.create({
      windowDays: WINDOW_DAYS,
      generatedAt,
      entries,
      meta,
    });

    return res.json({
      windowDays: WINDOW_DAYS,
      generatedAt,
      fromCache: false,
      entries,
      meta,
    });
  } catch (e) {
    next(e);
  }
};
