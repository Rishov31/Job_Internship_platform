import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { me } from "../../api/authApi";

const emptyForm = () => ({
  personalInfo: { address: {} },
  professionalInfo: {},
  skills: { technical: [], soft: [] },
  education: [],
  experience: [],
  resume: {},
  preferences: { jobCategories: [], locations: [], jobAlerts: true },
});

const inp =
  "w-full rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 disabled:opacity-55 disabled:cursor-not-allowed";
const lbl = "block text-xs font-medium text-slate-400 mb-1.5";

export default function JobSeekerProfile() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [completion, setCompletion] = useState({
    completionPercentage: 0,
    isProfileComplete: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const resumeInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const backupRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const user = await me();
      if (!user) {
        navigate("/login");
        return;
      }
      if (user.role !== "jobseeker" && !user.isAdmin) {
        if (user.role === "employer") navigate("/startup/dashboard");
        else if (user.role === "investor") navigate("/investor/dashboard");
        else navigate("/");
        return;
      }
      if (!cancelled) setAuthUser(user);

      try {
        const r = await fetch("/api/jobseeker/profile", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (r.status === 404) {
          if (!cancelled) setProfile(null);
        } else if (r.ok) {
          const d = await r.json();
          if (!cancelled) {
            setProfile(d);
            setForm((prev) => ({ ...prev, ...d }));
          }
        }
        const cr = await fetch("/api/jobseeker/profile/completion", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (cr.ok) {
          const c = await cr.json();
          if (!cancelled) {
            setCompletion(c);
            setEditing(!c.isProfileComplete);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const validate = () => {
    const e = {};
    if (!(form?.personalInfo?.firstName || "").trim()) e.firstName = "Required";
    if (!(form?.personalInfo?.lastName || "").trim()) e.lastName = "Required";
    const ph = form?.personalInfo?.phone || "";
    if (ph && !/^\d{10}$/.test(ph)) e.phone = "Enter 10 digits";
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const token = localStorage.getItem("token");
    const r = await fetch("/api/jobseeker/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(form),
    });
    let d = {};
    try {
      d = await r.json();
    } catch {
      /* ignore */
    }
    if (!r.ok) {
      alert(d.message || `Failed to save profile (HTTP ${r.status}).`);
      return;
    }
    setProfile(d);
    setForm((prev) => ({ ...prev, ...d }));
    const cr = await fetch("/api/jobseeker/profile/completion", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (cr.ok) {
      const c = await cr.json();
      setCompletion(c);
      setEditing(!c.isProfileComplete);
    }
    backupRef.current = null;
  };

  const update = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev?.[section] || {}), [key]: value },
    }));
  };

  const addArrayItem = (section, newItem) => {
    setForm((prev) => ({
      ...prev,
      [section]: [...(prev?.[section] || []), newItem],
    }));
  };

  const updateArrayItem = (section, index, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: (prev?.[section] || []).map((it, i) =>
        i === index ? { ...it, [key]: value } : it
      ),
    }));
  };

  const removeArrayItem = (section, index) => {
    setForm((prev) => ({
      ...prev,
      [section]: (prev?.[section] || []).filter((_, i) => i !== index),
    }));
  };

  const addSkill = (type, value) => {
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      skills: {
        ...(prev.skills || { technical: [], soft: [] }),
        [type]: [...(prev.skills?.[type] || []), value],
      },
    }));
  };

  const removeSkill = (type, index) => {
    setForm((prev) => ({
      ...prev,
      skills: {
        ...(prev.skills || { technical: [], soft: [] }),
        [type]: (prev.skills?.[type] || []).filter((_, i) => i !== index),
      },
    }));
  };

  const uploadResume = async (file) => {
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    const token = localStorage.getItem("token");
    const r = await fetch("/api/jobseeker/profile/resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ fileName: file.name, fileUrl }),
    });
    const d = await r.json();
    if (r.ok) {
      setProfile(d.profile);
      setForm(d.profile);
      const cr = await fetch("/api/jobseeker/profile/completion", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (cr.ok) {
        const c = await cr.json();
        setCompletion(c);
        setEditing(!c.isProfileComplete);
      }
    } else alert(d.message || "Resume upload failed");
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      personalInfo: { ...(prev.personalInfo || {}), profilePicture: fileUrl },
    }));
  };

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition ${
        activeTab === id
          ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20"
          : "bg-slate-900/70 text-slate-300 border border-slate-700/80 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );

  const initials = useMemo(() => {
    const f = form?.personalInfo?.firstName || "";
    const l = form?.personalInfo?.lastName || "";
    return `${f[0] || ""}${l[0] || ""}`.toUpperCase();
  }, [form]);

  const liveCompletion = useMemo(() => {
    const p = form || {};
    let s = 0;
    if (p.personalInfo?.firstName && p.personalInfo?.lastName) s += 20;
    if ((p.skills?.technical || []).length) s += 15;
    if ((p.education || []).length) s += 15;
    if ((p.experience || []).length) s += 15;
    if (p.resume?.fileUrl) s += 20;
    if (p.professionalInfo?.currentTitle) s += 15;
    return Math.min(s, 100);
  }, [form]);

  const dateStr = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().substring(0, 10);
  };

  const startEdit = () => {
    backupRef.current = JSON.parse(JSON.stringify(form));
    setEditing(true);
  };

  const cancelEdit = () => {
    if (backupRef.current) {
      setForm(backupRef.current);
      backupRef.current = null;
    } else if (profile) {
      setForm({ ...emptyForm(), ...profile });
    }
    setEditing(false);
  };

  const pct = editing ? liveCompletion : completion.completionPercentage;

  const completionHints = [
    { ok: !!(form?.personalInfo?.firstName && form?.personalInfo?.lastName), t: "Name" },
    { ok: (form?.skills?.technical || []).length > 0, t: "Technical skills" },
    { ok: (form?.education || []).length > 0, t: "Education" },
    { ok: (form?.experience || []).length > 0, t: "Experience" },
    { ok: !!form?.resume?.fileUrl, t: "Resume" },
    { ok: !!form?.professionalInfo?.currentTitle, t: "Professional title" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050818] flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050818] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_50%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.08),transparent_45%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <Link
              to="/student/dashboard"
              className="text-xs text-sky-400 hover:text-sky-300 mb-2 inline-block"
            >
              ← Back to Student dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50 tracking-tight">
              My profile
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Build your profile for applications, mentorship, and startup
              collaborations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {completion.isProfileComplete && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20"
              >
                Edit profile
              </button>
            )}
            {completion.isProfileComplete && editing && (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
                >
                  Save changes
                </button>
              </>
            )}
            {!completion.isProfileComplete && (
              <button
                type="button"
                onClick={save}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
              >
                Save progress
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 backdrop-blur p-6 mb-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {form?.personalInfo?.profilePicture ? (
                  <img
                    src={form.personalInfo.profilePicture}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-600"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-lg font-bold text-white">
                    {initials || "?"}
                  </div>
                )}
                {editing && (
                  <>
                    <button
                      type="button"
                      className="absolute -bottom-1 -right-1 text-[10px] px-2 py-0.5 rounded-lg bg-indigo-600 text-white"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      Photo
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadAvatar(e.target.files?.[0])}
                    />
                  </>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-50">
                  {form?.personalInfo?.firstName || ""}{" "}
                  {form?.personalInfo?.lastName || ""}
                </p>
                <p className="text-sm text-slate-400">
                  {form?.professionalInfo?.currentTitle || "Add your title"}
                </p>
                {authUser?.email && (
                  <p className="text-xs text-slate-500 mt-1">{authUser.email}</p>
                )}
              </div>
            </div>

            <div className="flex-1 lg:max-w-sm w-full">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Completion</span>
                <span className="text-sky-300 font-semibold">{pct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {completion.isProfileComplete
                  ? "Profile complete (≥70%). Use Edit profile to make changes."
                  : "Complete all sections to reach 70% — then Edit profile unlocks."}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-700/60">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
              Checklist
            </p>
            <div className="flex flex-wrap gap-2">
              {completionHints.map((h) => (
                <span
                  key={h.t}
                  className={`text-[11px] px-2 py-1 rounded-lg border ${
                    h.ok
                      ? "border-emerald-500/50 text-emerald-300 bg-emerald-500/10"
                      : "border-slate-600 text-slate-500"
                  }`}
                >
                  {h.ok ? "✓ " : "○ "}
                  {h.t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabBtn("personal", "Personal")}
          {tabBtn("professional", "Professional")}
          {tabBtn("skills", "Skills")}
          {tabBtn("education", "Education")}
          {tabBtn("experience", "Experience")}
          {tabBtn("resume", "Resume")}
          {tabBtn("preferences", "Preferences")}
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur p-6 md:p-8 shadow-xl">
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={lbl}>First name *</label>
                <input
                  className={`${inp} ${errors.firstName ? "border-red-500" : ""}`}
                  disabled={!editing}
                  value={form?.personalInfo?.firstName || ""}
                  onChange={(e) =>
                    update("personalInfo", "firstName", e.target.value)
                  }
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className={lbl}>Last name *</label>
                <input
                  className={`${inp} ${errors.lastName ? "border-red-500" : ""}`}
                  disabled={!editing}
                  value={form?.personalInfo?.lastName || ""}
                  onChange={(e) =>
                    update("personalInfo", "lastName", e.target.value)
                  }
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-400 mt-1">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label className={lbl}>Mobile (10 digits)</label>
                <input
                  className={`${inp} ${errors.phone ? "border-red-500" : ""}`}
                  disabled={!editing}
                  value={form?.personalInfo?.phone || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 10 && /^\d*$/.test(value)) {
                      update("personalInfo", "phone", value);
                    }
                  }}
                  placeholder="10-digit mobile"
                />
                {errors.phone && (
                  <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className={lbl}>Date of birth</label>
                <input
                  type="date"
                  className={inp}
                  disabled={!editing}
                  value={
                    form?.personalInfo?.dateOfBirth
                      ? String(form.personalInfo.dateOfBirth).substring(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    update("personalInfo", "dateOfBirth", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={lbl}>Gender</label>
                <select
                  className={inp}
                  disabled={!editing}
                  value={form?.personalInfo?.gender || ""}
                  onChange={(e) =>
                    update("personalInfo", "gender", e.target.value)
                  }
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className={lbl}>City / location</label>
                <input
                  className={inp}
                  disabled={!editing}
                  value={form?.personalInfo?.address?.city || ""}
                  onChange={(e) =>
                    update("personalInfo", "address", {
                      ...(form?.personalInfo?.address || {}),
                      city: e.target.value,
                    })
                  }
                  placeholder="City"
                />
              </div>
            </div>
          )}

          {activeTab === "professional" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={lbl}>Current title</label>
                <input
                  className={inp}
                  disabled={!editing}
                  value={form?.professionalInfo?.currentTitle || ""}
                  onChange={(e) =>
                    update("professionalInfo", "currentTitle", e.target.value)
                  }
                  placeholder="e.g. CS undergrad, SDE"
                />
              </div>
              <div>
                <label className={lbl}>Years of experience</label>
                <input
                  type="number"
                  min="0"
                  className={inp}
                  disabled={!editing}
                  value={form?.professionalInfo?.yearsOfExperience ?? ""}
                  onChange={(e) =>
                    update(
                      "professionalInfo",
                      "yearsOfExperience",
                      Number(e.target.value || 0)
                    )
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Job types (hold Ctrl/Cmd to select)</label>
                <select
                  multiple
                  className={`${inp} h-32`}
                  disabled={!editing}
                  value={form?.professionalInfo?.jobType || []}
                  onChange={(e) => {
                    const vals = [...e.target.selectedOptions].map((o) => o.value);
                    update("professionalInfo", "jobType", vals);
                  }}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Work location</label>
                <select
                  className={inp}
                  disabled={!editing}
                  value={form?.professionalInfo?.workLocation || "on-site"}
                  onChange={(e) =>
                    update("professionalInfo", "workLocation", e.target.value)
                  }
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Notice period</label>
                <input
                  className={inp}
                  disabled={!editing}
                  value={form?.professionalInfo?.noticePeriod || ""}
                  onChange={(e) =>
                    update("professionalInfo", "noticePeriod", e.target.value)
                  }
                  placeholder="e.g. 30 days"
                />
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-6">
              <div>
                <label className={lbl}>Technical skills</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {(form.skills?.technical || []).map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 text-sm border border-indigo-500/30"
                    >
                      {s}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => removeSkill("technical", i)}
                          className="ml-2 text-indigo-300 hover:text-white"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <input
                    className={inp}
                    placeholder="Type skill & press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill("technical", e.currentTarget.value.trim());
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                )}
              </div>
              <div>
                <label className={lbl}>Soft skills</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {(form.skills?.soft || []).map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-100 text-sm border border-amber-500/25"
                    >
                      {s}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => removeSkill("soft", i)}
                          className="ml-2 text-amber-200 hover:text-white"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <input
                    className={inp}
                    placeholder="Type skill & press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill("soft", e.currentTarget.value.trim());
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4">
              {(form.education || []).map((ed, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-700/80 bg-slate-900/40"
                >
                  <input
                    className={inp}
                    placeholder="Institution"
                    disabled={!editing}
                    value={ed.institution || ""}
                    onChange={(e) =>
                      updateArrayItem("education", i, "institution", e.target.value)
                    }
                  />
                  <input
                    className={inp}
                    placeholder="Degree"
                    disabled={!editing}
                    value={ed.degree || ""}
                    onChange={(e) =>
                      updateArrayItem("education", i, "degree", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    className={inp}
                    disabled={!editing}
                    value={dateStr(ed.startDate)}
                    onChange={(e) =>
                      updateArrayItem("education", i, "startDate", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    className={inp}
                    disabled={!editing}
                    value={dateStr(ed.endDate)}
                    onChange={(e) =>
                      updateArrayItem("education", i, "endDate", e.target.value)
                    }
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem("education", i)}
                      className="text-xs text-red-400 hover:text-red-300 md:col-span-3 text-left"
                    >
                      Remove entry
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    addArrayItem("education", { institution: "", degree: "" })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
                >
                  + Add education
                </button>
              )}
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-4">
              {(form.experience || []).map((ex, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-700/80 bg-slate-900/40"
                >
                  <input
                    className={inp}
                    placeholder="Company"
                    disabled={!editing}
                    value={ex.company || ""}
                    onChange={(e) =>
                      updateArrayItem("experience", i, "company", e.target.value)
                    }
                  />
                  <input
                    className={inp}
                    placeholder="Position"
                    disabled={!editing}
                    value={ex.position || ""}
                    onChange={(e) =>
                      updateArrayItem("experience", i, "position", e.target.value)
                    }
                  />
                  <input
                    className={inp}
                    placeholder="Location"
                    disabled={!editing}
                    value={ex.location || ""}
                    onChange={(e) =>
                      updateArrayItem("experience", i, "location", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    className={inp}
                    disabled={!editing}
                    value={dateStr(ex.startDate)}
                    onChange={(e) =>
                      updateArrayItem("experience", i, "startDate", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    className={inp}
                    disabled={!editing}
                    value={dateStr(ex.endDate)}
                    onChange={(e) =>
                      updateArrayItem("experience", i, "endDate", e.target.value)
                    }
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem("experience", i)}
                      className="text-xs text-red-400 hover:text-red-300 md:col-span-3 text-left"
                    >
                      Remove entry
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    addArrayItem("experience", { company: "", position: "" })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
                >
                  + Add experience
                </button>
              )}
            </div>
          )}

          {activeTab === "resume" && (
            <div>
              {form?.resume?.fileUrl ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-700 p-4 bg-slate-900/40">
                  <div className="text-sm">
                    <div className="font-medium text-slate-100">
                      {form.resume.fileName}
                    </div>
                    <div className="text-slate-500 text-xs">Uploaded</div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={form.resume.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl border border-slate-600 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      View
                    </a>
                    {editing && (
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"
                      >
                        Replace
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No resume uploaded yet.</p>
              )}
              {editing && (
                <>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => uploadResume(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"
                  >
                    Upload resume
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={lbl}>Preferred locations</label>
                <input
                  className={inp}
                  disabled={!editing}
                  value={(form?.preferences?.locations || []).join(", ")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      preferences: {
                        ...(prev.preferences || {}),
                        locations: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="Comma separated"
                />
              </div>
              <div>
                <label className={lbl}>Preferred categories</label>
                <input
                  className={inp}
                  disabled={!editing}
                  value={(form?.preferences?.jobCategories || []).join(", ")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      preferences: {
                        ...(prev.preferences || {}),
                        jobCategories: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="Comma separated"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
                <input
                  type="checkbox"
                  disabled={!editing}
                  checked={!!form?.preferences?.jobAlerts}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      preferences: {
                        ...(prev.preferences || {}),
                        jobAlerts: e.target.checked,
                      },
                    }))
                  }
                  className="rounded border-slate-600"
                />
                Receive job alerts
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
