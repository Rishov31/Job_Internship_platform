const axios = require("axios");
const JobSeekerProfile = require("../models/JobSeekerProfile");
const Contribution = require("../models/Contribution");
const Application = require("../models/Application");
const User = require("../models/User");

function summarizeStudent(profile, user, contributions, applications) {
  const approved = contributions.filter((c) => c.status === "approved");
  const rejected = contributions.filter((c) => c.status === "rejected");
  const pending = contributions.filter((c) => c.status === "pending");
  const totalPoints = approved.reduce((sum, c) => sum + (Number(c.pointsAwarded) || 0), 0);
  const uniqueStartups = new Set(
    approved.map((c) => (c.startup ? String(c.startup._id || c.startup) : null)).filter(Boolean)
  ).size;
  const interviews = applications.filter(
    (a) => a.status === "interview" || a.metadata?.interview || a.metadata?.interviewSessionId
  ).length;

  return {
    name: user?.fullName || "Student",
    githubUsername: user?.githubUsername || "",
    profileCompletion: Number(profile?.profileCompletionPercentage || 0),
    collaborationLevel: profile?.collaborationLevel || "Bronze",
    contributionScore: Number(profile?.contributionScore || 0),
    technicalSkills: profile?.skills?.technical || [],
    softSkills: profile?.skills?.soft || [],
    experienceYears: Number(profile?.professionalInfo?.yearsOfExperience || 0),
    currentTitle: profile?.professionalInfo?.currentTitle || "",
    contributionSummary: {
      total: contributions.length,
      approved: approved.length,
      rejected: rejected.length,
      pending: pending.length,
      totalPoints,
      uniqueStartups,
    },
    applicationSummary: {
      total: applications.length,
      interviews,
    },
    recentContributions: contributions.slice(0, 5).map((c) => ({
      status: c.status,
      pointsAwarded: Number(c.pointsAwarded || 0),
      startupName: c.startup?.name || "Startup",
      description: c.description || "",
      createdAt: c.createdAt,
    })),
  };
}

function buildFallbackCoachReply(student, userMessage) {
  const raw = String(userMessage || "").trim();
  const text = raw.toLowerCase();
  const isGreetingOnly =
    /^(hi|hello|hey|hii|heyy|yo|good morning|good afternoon|good evening)\b[!. ]*$/.test(
      text
    );
  const wantsPerformance = /(performance|review|assessment|progress|score)/i.test(text);
  const wantsImprovement = /(improve|improvement|weak|weakness|better|focus area)/i.test(text);
  const wantsPlan = /(plan|roadmap|2 week|two week|next week|schedule)/i.test(text);
  const wantsRole = /(role|job|career|internship|position|suggest)/i.test(text);

  if (isGreetingOnly) {
    return [
      `Hi ${student.name || "there"}!`,
      "",
      "I can help with any one topic below. Ask directly, for example:",
      "- \"Give me role suggestions based on my skills\"",
      "- \"Review my performance and weak areas\"",
      "- \"Create a 2-week improvement plan for me\"",
      "",
      "If you want, I can start with a quick performance summary right now.",
    ].join("\n");
  }

  const strengths = [];
  const improvements = [];
  const plan = [];
  const roles = [];

  if (student.profileCompletion >= 70) strengths.push("Your profile is mostly complete, which improves recruiter trust.");
  else improvements.push("Increase profile completion to at least 80% (headline, experience, resume, skills).");

  if (student.contributionSummary.approved >= 2) {
    strengths.push(
      `You have ${student.contributionSummary.approved} approved contributions, showing execution consistency.`
    );
  } else {
    improvements.push("Aim for 2-3 approved contributions to show real project impact.");
  }

  if (student.contributionScore >= 300) strengths.push("Your contribution score indicates strong momentum in practical work.");
  else improvements.push("Raise contribution score with small but frequent high-quality PRs.");

  if (student.technicalSkills.length >= 3) strengths.push("You already have a base technical stack to position for internships/entry roles.");
  else improvements.push("Add 4-6 concrete technical skills in profile (frameworks, tools, cloud, testing).");

  if (student.applicationSummary.interviews > 0) strengths.push("You are converting applications into interviews.");
  else improvements.push("Improve interview conversion: tailor resume and apply to closely matched roles.");

  plan.push("Week 1: Update profile/resume + publish one polished project with README and deployment link.");
  plan.push("Week 1: Submit 3 targeted applications that match your top skills exactly.");
  plan.push("Week 2: Make 2 meaningful OSS/startup contributions and document outcomes.");
  plan.push("Week 2: Practice 5 DSA + 2 mock interviews; note weak areas and revise.");

  const tech = student.technicalSkills.map((s) => s.toLowerCase());
  if (tech.some((s) => ["react", "node", "express", "javascript", "typescript"].includes(s))) {
    roles.push("Frontend Developer Intern");
    roles.push("Full Stack Developer Intern (React + Node)");
  }
  if (tech.some((s) => ["python", "django", "flask", "fastapi"].includes(s))) {
    roles.push("Backend Developer Intern (Python)");
  }
  if (tech.some((s) => ["aws", "docker", "kubernetes", "devops"].includes(s))) {
    roles.push("DevOps / Cloud Intern");
  }
  if (!roles.length) {
    roles.push("Software Engineering Intern");
    roles.push("Junior Web Developer");
  }

  const showPerformance = wantsPerformance || (!wantsImprovement && !wantsPlan && !wantsRole);
  const showImprovement = wantsImprovement || wantsPerformance;
  const showPlan = wantsPlan || wantsImprovement;
  const showRoles = wantsRole || (!wantsPerformance && !wantsImprovement && !wantsPlan);

  const lines = [
    "OpenAI is temporarily unavailable (quota/billing). Showing targeted coaching from your dashboard data.",
    "",
  ];

  if (showPerformance) {
    lines.push("Performance assessment:");
    lines.push(`- Profile completion: ${student.profileCompletion}%`);
    lines.push(`- Contribution score: ${student.contributionScore}`);
    lines.push(
      `- Approved contributions: ${student.contributionSummary.approved}/${student.contributionSummary.total}`
    );
    lines.push(
      `- Applications: ${student.applicationSummary.total}, interviews: ${student.applicationSummary.interviews}`
    );
    lines.push("");
  }

  if (showImprovement) {
    lines.push("Areas of improvement:");
    (improvements.length
      ? improvements
      : ["Focus on sharper role targeting and interview prep."]
    ).forEach((s) => lines.push(`- ${s}`));
    lines.push("");
  }

  if (showPlan) {
    lines.push("2-week action plan:");
    plan.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }

  if (showRoles) {
    lines.push("Suggested roles:");
    roles.slice(0, 4).forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }

  lines.push("Top strengths:");
  (strengths.length
    ? strengths
    : ["You are active on the platform; keep building consistency."]
  )
    .slice(0, 3)
    .forEach((s) => lines.push(`- ${s}`));

  return lines.join("\n");
}

exports.chatWithAiCoach = async (req, res) => {
  try {
    const openAiKey = process.env.OPENAI_API_KEY;
    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const [profile, user, contributions, applications] = await Promise.all([
      JobSeekerProfile.findOne({ user: req.user.id }).lean(),
      User.findById(req.user.id).select("fullName githubUsername").lean(),
      Contribution.find({ student: req.user.id })
        .populate("startup", "name")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Application.find({ applicant: req.user.id }).lean(),
    ]);

    const studentSummary = summarizeStudent(profile, user, contributions, applications);
    if (!openAiKey) {
      return res.json({
        reply: buildFallbackCoachReply(studentSummary, message),
        source: "fallback",
      });
    }
    const cleanedHistory = history
      .filter((m) => m && typeof m === "object")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 2000),
      }))
      .filter((m) => m.content);

    const systemPrompt =
      "You are HireMe AI Career Coach for students. " +
      "Give practical, personalized career guidance with a supportive tone. " +
      "Always include: (1) short performance assessment, (2) 3-5 strengths, " +
      "(3) 3-5 areas of improvement, (4) a concrete 2-week action plan, " +
      "and (5) role/job suggestions aligned with skills. " +
      "Do not invent facts and use the provided dashboard metrics.";

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "system", content: `Student summary JSON:\n${JSON.stringify(studentSummary)}` },
          ...cleanedHistory.slice(-8),
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ message: "AI returned empty response" });
    }

    return res.json({
      reply,
      context: {
        profileCompletion: studentSummary.profileCompletion,
        contributionScore: studentSummary.contributionScore,
        collaborationLevel: studentSummary.collaborationLevel,
        approvedContributions: studentSummary.contributionSummary.approved,
        totalApplications: studentSummary.applicationSummary.total,
        interviews: studentSummary.applicationSummary.interviews,
      },
    });
  } catch (err) {
    const apiMsg = err?.response?.data?.error?.message || "";
    const code = err?.response?.status;
    const quotaLike =
      code === 429 ||
      /quota|billing|exceeded|insufficient_quota|rate limit/i.test(apiMsg);

    if (quotaLike) {
      try {
        const message = String(req.body?.message || "").trim() || "career guidance";
        const [profile, user, contributions, applications] = await Promise.all([
          JobSeekerProfile.findOne({ user: req.user.id }).lean(),
          User.findById(req.user.id).select("fullName githubUsername").lean(),
          Contribution.find({ student: req.user.id })
            .populate("startup", "name")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean(),
          Application.find({ applicant: req.user.id }).lean(),
        ]);
        const studentSummary = summarizeStudent(profile, user, contributions, applications);
        return res.json({
          reply: buildFallbackCoachReply(studentSummary, message),
          source: "fallback",
        });
      } catch {
        // continue to generic error response
      }
    }

    const msg =
      apiMsg ||
      err.message ||
      "Unable to get AI guidance right now";
    return res.status(502).json({ message: msg });
  }
};
