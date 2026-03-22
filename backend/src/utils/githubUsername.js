/**
 * Accepts plain login or profile/repo URL; returns normalized GitHub login or null.
 * e.g. "https://github.com/Rishov31/" -> "rishov31"
 *      "https://github.com/Rishov31/Job_Internship_platform" -> "rishov31" (owner)
 */
function normalizeGithubUsernameInput(raw) {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  let s = t.replace(/^@/, "");
  const m = s.match(/github\.com\/([^/?#]+)(?:\/([^/?#]+))?/i);
  if (m) {
    const first = m[1];
    const reserved = new Set([
      "settings",
      "orgs",
      "dashboard",
      "login",
      "signup",
      "topics",
      "explore",
      "marketplace",
    ]);
    if (reserved.has(first.toLowerCase())) return null;
    return first.toLowerCase();
  }
  return s.toLowerCase().replace(/\s+/g, "") || null;
}

module.exports = { normalizeGithubUsernameInput };
