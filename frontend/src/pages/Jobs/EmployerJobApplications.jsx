import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createInterviewSession } from "../../api/interviewApi";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EmployerJobApplications() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs/${jobId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.title) setJobTitle(j.title);
      })
      .catch(() => {});

    fetch(`/api/applications/jobs/${jobId}`, {
      headers: { ...authHeader() },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setApplications(data?.applications || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const patchStatus = async (applicationId, body) => {
    setBusyId(applicationId);
    try {
      const r = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Update failed");
      const updated = data.application || data;
      setApplications((prev) =>
        prev.map((a) => (a._id === applicationId ? { ...a, ...updated } : a))
      );
    } catch (e) {
      window.alert(e.message || "Error");
    } finally {
      setBusyId(null);
    }
  };

  const startCodingInterview = async (applicationId) => {
    setBusyId(applicationId);
    try {
      const { session } = await createInterviewSession(applicationId);
      navigate(`/interview/coding/${session._id}`);
    } catch (e) {
      window.alert(e.message || "Could not start session");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link to="/employer/jobs" className="text-sm text-sky-600 hover:underline">
              ← Manage jobs
            </Link>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">
              Applications {jobTitle ? `· ${jobTitle}` : ""}
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {applications.length === 0 ? (
          <p className="text-slate-600">No applications yet.</p>
        ) : (
          <ul className="space-y-4">
            {applications.map((app) => (
              <li
                key={app._id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {app.applicant?.fullName || "Candidate"}
                    </p>
                    <p className="text-sm text-slate-500">{app.applicant?.email}</p>
                    <p className="text-xs mt-2">
                      Status:{" "}
                      <span className="font-semibold capitalize">{app.status}</span>
                    </p>
                    {app.coverLetter && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                        {app.coverLetter}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === app._id}
                      onClick={() =>
                        patchStatus(app._id, { status: "shortlisted" })
                      }
                      className="px-3 py-1.5 text-xs rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200"
                    >
                      Shortlist
                    </button>
                    <button
                      type="button"
                      disabled={busyId === app._id}
                      onClick={() => {
                        const interviewDate =
                          window.prompt(
                            "Interview date (optional, e.g. 2026-03-25)"
                          ) || "";
                        const interviewTime =
                          window.prompt(
                            "Interview time (optional, e.g. 3:00 PM)"
                          ) || "";
                        patchStatus(app._id, {
                          status: "interview",
                          interviewDate: interviewDate.trim() || undefined,
                          interviewTime: interviewTime.trim() || undefined,
                          interviewNotes: "Interview scheduled from HireMe",
                        });
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-indigo-100 text-indigo-900 hover:bg-indigo-200"
                    >
                      Schedule interview
                    </button>
                    <button
                      type="button"
                      disabled={busyId === app._id}
                      onClick={() => startCodingInterview(app._id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                    >
                      Coding interview (video + editor)
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
