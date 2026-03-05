import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { registerUser } from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "jobseeker" });
  const [submitting, setSubmitting] = useState(false);

  // Map backend role keys to nicer labels used in UI
  const roleLabels = {
    jobseeker: "Student",
    employer: "Startup",
    investor: "Investor",
  };

  useEffect(() => {
    const roleFromQuery = searchParams.get("role");
    if (!roleFromQuery) return;

    // Only allow known roles from URL
    if (["jobseeker", "employer", "investor"].includes(roleFromQuery)) {
      setForm((prev) => ({ ...prev, role: roleFromQuery }));
    }
  }, [searchParams]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await registerUser(form);
      const role = response.user?.role;

      // store token & user so subsequent dashboard API calls are authenticated
      if (response.token) {
        try {
          localStorage.setItem("token", response.token);
          localStorage.setItem("role", role || "");
          localStorage.setItem("user", JSON.stringify(response.user));
        } catch {
          // ignore storage failure
        }
      }

      // Redirect based on user role
      if (role === "employer") {
        // Startup dashboard (new ecosystem view)
        navigate("/startup/dashboard");
      } else if (role === "jobseeker") {
        // Student dashboard (new ecosystem view)
        navigate("/student/dashboard");
      } else if (role === "investor") {
        navigate("/investor/dashboard");
      } else if (role === "mentor") {
        navigate("/mentor/dashboard");
      } else {
        navigate("/login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <div className="text-sky-600 font-extrabold text-xl">HireTalent</div>
          <h1 className="mt-2 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-gray-600">
            Join the Startup & MSME Talent Ecosystem.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              required
              className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Select your role</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {["jobseeker", "employer", "investor"].map((roleKey) => {
                const active = form.role === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: roleKey }))}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-gray-200 hover:border-sky-300 hover:bg-sky-50/60"
                    }`}
                  >
                    <div className="font-semibold">{roleLabels[roleKey]}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {roleKey === "jobseeker" && "Explore jobs, internships & contributions"}
                      {roleKey === "employer" && "Post roles, open-source issues & rewards"}
                      {roleKey === "investor" && "Track startup growth & manage portfolio"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-600 text-white rounded-md py-2 font-medium hover:bg-sky-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-sky-700 font-medium">Login</Link>
        </div>
      </div>
    </div>
  );
}


