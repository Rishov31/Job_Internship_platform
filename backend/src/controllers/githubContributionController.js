const User = require("../models/User");
const { normalizeGithubUsernameInput } = require("../utils/githubUsername");
const { getStudentGithubActivity } = require("../services/githubContributionService");

/**
 * GET /api/contributions/github/activity
 * Jobseeker: real GitHub commits/PRs across platform startup repos
 */
exports.getGithubActivity = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const gh = normalizeGithubUsernameInput(user.githubUsername || "") || "";
    if (!gh) {
      return res.json({
        success: false,
        needsGithubUsername: true,
        message: "Add your GitHub username in profile to load live contribution data.",
        chart: [],
        weeklyInsight: null,
        streak: 0,
        level: { level: "Bronze", tier: "bronze" },
        topStartup: null,
        totalCommitsAndPRs: 0,
        reposScanned: 0,
      });
    }

    const maxRepos = req.query.maxRepos;
    const days = req.query.days;
    const data = await getStudentGithubActivity(gh, { maxRepos, days });
    res.json({ success: true, needsGithubUsername: false, ...data });
  } catch (e) {
    if (e.response?.status === 403) {
      return res.status(200).json({
        success: false,
        githubError: true,
        message:
          "GitHub rate limit or access denied. Set GITHUB_TOKEN in server env for higher limits.",
        chart: [],
        weeklyInsight: null,
        streak: 0,
        level: { level: "Bronze", tier: "bronze" },
        topStartup: null,
        totalCommitsAndPRs: 0,
        reposScanned: 0,
      });
    }
    next(e);
  }
};
