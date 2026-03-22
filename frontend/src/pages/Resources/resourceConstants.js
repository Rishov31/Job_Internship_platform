/** Shared filters + labels for Career Guidance resources (list + student shell) */

export const RESOURCE_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "career-planning", label: "Career Planning" },
  { value: "interview-tips", label: "Interview Tips" },
  { value: "resume-writing", label: "Resume Writing" },
  { value: "job-search", label: "Job Search" },
  { value: "skill-development", label: "Skill Development" },
  { value: "networking", label: "Networking" },
  { value: "workplace-ethics", label: "Workplace Ethics" },
  { value: "leadership", label: "Leadership" },
  { value: "other", label: "Other" },
];

export const RESOURCE_TYPES = [
  { value: "", label: "All Types" },
  { value: "article", label: "Articles" },
  { value: "video", label: "Videos" },
  { value: "blog", label: "Blogs" },
];

export function getCategoryLabel(value) {
  return RESOURCE_CATEGORIES.find((c) => c.value === value)?.label || value;
}

/** @param {"light"|"dark"} theme */
export function getTypeBadgeClass(type, theme = "light") {
  if (theme === "dark") {
    switch (type) {
      case "video":
        return "bg-rose-500/20 text-rose-200 border border-rose-500/35";
      case "blog":
        return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/35";
      default:
        return "bg-sky-500/20 text-sky-200 border border-sky-500/35";
    }
  }
  switch (type) {
    case "video":
      return "bg-red-100 text-red-800";
    case "blog":
      return "bg-green-100 text-green-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}
