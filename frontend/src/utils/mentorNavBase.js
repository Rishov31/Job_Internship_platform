/** Base path for mentor chat/video when user is jobseeker vs startup founder vs investor */
export function getMentorNavBase() {
  if (typeof window === "undefined") return "/jobseeker";
  const role = localStorage.getItem("role");
  if (role === "employer") return "/startup";
  if (role === "investor") return "/investor";
  return "/jobseeker";
}
