import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { me } from "../../api/authApi";

const input =
  "w-full rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 disabled:opacity-55 disabled:cursor-not-allowed";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function StartupProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);
  const [completion, setCompletion] = useState({
    completionPercentage: 0,
    isProfileComplete: false,
  });
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    industry: "",
    description: "",
    stage: "pre-seed",
    websiteUrl: "",
    githubUrl: "",
  });
  const [activeTab, setActiveTab] = useState("company");
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
      if (user.role !== "employer" && !user.isAdmin) {
        if (user.role === "jobseeker") navigate("/student/dashboard");
        else if (user.role === "investor") navigate("/investor/dashboard");
        else navigate("/");
        return;
      }

      try {
        const r = await fetch("/api/startups/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const data = await r.json();
        if (cancelled) return;
        if (data.startup) {
          const s = data.startup;
          setForm({
            name: s.name || "",
            logoUrl: s.logoUrl || "",
            industry: s.industry || "",
            description: s.description || "",
            stage: s.stage || "pre-seed",
            websiteUrl: s.websiteUrl || "",
            githubUrl: s.githubUrl || "",
          });
        }
        if (data.completion) {
          setCompletion(data.completion);
          setEditing(!data.completion.isProfileComplete);
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

  const liveCompletion = useMemo(() => {
    let p = 0;
    if ((form.name || "").trim().length >= 2) p += 15;
    if ((form.industry || "").trim().length >= 2) p += 15;
    if ((form.description || "").trim().length >= 40) p += 25;
    if (form.stage) p += 10;
    if ((form.websiteUrl || "").trim().length >= 4) p += 15;
    if ((form.logoUrl || "").trim().length >= 4) p += 10;
    if ((form.githubUrl || "").trim().length >= 4) p += 10;
    return Math.min(p, 100);
  }, [form]);

  const save = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    try {
      const r = await fetch("/api/startups/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data.message || "Could not save profile");
        return;
      }
      if (data.completion) {
        setCompletion(data.completion);
        setEditing(!data.completion.isProfileComplete);
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
        activeTab === id
          ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-500/25"
          : "bg-slate-900/60 text-slate-300 border border-slate-700/80 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050818] flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  const pct = editing ? liveCompletion : completion.completionPercentage;
  const showEdit = completion.isProfileComplete;

  const startEdit = () => {
    backupRef.current = JSON.parse(JSON.stringify(form));
    setEditing(true);
  };

  const cancelEdit = () => {
    if (backupRef.current) {
      setForm(backupRef.current);
      backupRef.current = null;
    }
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#050818] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_50%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.1),transparent_45%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              to="/startup/dashboard"
              className="text-xs text-sky-400 hover:text-sky-300 mb-2 inline-block"
            >
              ← Back to Startup dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50 tracking-tight">
              Company profile
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Complete your startup details for discovery, investors, and student
              explorer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {showEdit && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-95"
              >
                Edit profile
              </button>
            )}
            {showEdit && editing && (
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
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </>
            )}
            {!showEdit && (
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save progress"}
              </button>
            )}
          </div>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 backdrop-blur p-6 mb-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-600"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-xl font-bold text-white">
                  {(form.name || "S").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-slate-50">
                  {form.name || "Your company name"}
                </p>
                <p className="text-sm text-slate-400">
                  {form.industry || "Industry"} · {form.stage || "Stage"}
                </p>
              </div>
            </div>
            <div className="md:min-w-[240px] w-full">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Profile completion</span>
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
                  ? "Profile complete (≥70%). Use Edit profile to change details."
                  : "Save until you reach 70% — then view mode and Edit profile unlock."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabBtn("company", "Company")}
          {tabBtn("links", "Links & presence")}
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur p-6 md:p-8 shadow-xl">
          {activeTab === "company" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={label}>Company / product name *</label>
                <input
                  className={input}
                  disabled={!editing}
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Acme Labs Pvt Ltd"
                />
              </div>
              <div>
                <label className={label}>Industry *</label>
                <input
                  className={input}
                  disabled={!editing}
                  value={form.industry}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, industry: e.target.value }))
                  }
                  placeholder="e.g. FinTech, EdTech, AI"
                />
              </div>
              <div>
                <label className={label}>Stage</label>
                <select
                  className={input}
                  disabled={!editing}
                  value={form.stage}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stage: e.target.value }))
                  }
                >
                  <option value="pre-seed">Pre-seed</option>
                  <option value="seed">Seed</option>
                  <option value="series-a">Series A</option>
                  <option value="series-b">Series B</option>
                  <option value="bootstrapped">Bootstrapped</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={label}>
                  Description * (min. 40 characters for completion)
                </label>
                <textarea
                  rows={5}
                  className={input}
                  disabled={!editing}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="What you build, who you serve, traction…"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {form.description.length}/40+ characters
                </p>
              </div>
              <div className="md:col-span-2">
                <label className={label}>Logo URL (optional)</label>
                <input
                  className={input}
                  disabled={!editing}
                  value={form.logoUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, logoUrl: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </div>
            </div>
          )}

          {activeTab === "links" && (
            <div className="grid grid-cols-1 gap-5 max-w-xl">
              <div>
                <label className={label}>Website *</label>
                <input
                  className={input}
                  disabled={!editing}
                  value={form.websiteUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, websiteUrl: e.target.value }))
                  }
                  placeholder="https://yourcompany.com"
                />
              </div>
              <div>
                <label className={label}>GitHub org or main repo URL *</label>
                <input
                  className={input}
                  disabled={!editing}
                  value={form.githubUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, githubUrl: e.target.value }))
                  }
                  placeholder="https://github.com/your-org"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
