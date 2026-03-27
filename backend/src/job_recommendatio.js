// utils/jobRecommendation.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const explainJobMatch = async (req, res) => {
  const { job, user } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Explain why a job matches a user.

User Skills: ${user.skills}
Job Skills: ${job.skills}

Give short explanation.
        `,
      },
      {
        role: "user",
        content: "Why is this job suitable for me?",
      },
    ],
  });

  res.json({
    explanation: response.choices[0].message.content,
  });
};
export const recommendJobs = (user, jobs) => {
  return jobs.map((job) => {
    let matchScore = 0;

    const userSkills = user.skills.map((s) => s.toLowerCase());
    const jobSkills = job.skills.map((s) => s.toLowerCase());

    const matchedSkills = jobSkills.filter((skill) =>
      userSkills.includes(skill)
    );

    matchScore = (matchedSkills.length / jobSkills.length) * 100;

    return {
      ...job,
      matchScore: Math.round(matchScore),
      matchedSkills,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
};