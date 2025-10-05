import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "jobseeker" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await registerUser(form);
      // Redirect based on user role
      if (response.user?.role === "employer") {
        navigate("/employer/dashboard");
      } else if (response.user?.role === "jobseeker") {
        navigate("/jobseeker/dashboard");
      } else if (response.user?.role === "mentor") {
        navigate("/mentor/dashboard");
      } else if (response.user?.role === "others") {
        navigate("/login");
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
          <div className="text-sky-600 font-extrabold text-xl">HireMe</div>
          <h1 className="mt-2 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-gray-600">Join to find internships, jobs and courses.</p>
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
            <label className="block text-sm font-medium">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="jobseeker">Job Seeker</option>
              <option value="employer">Employer</option>
              <option value="mentor">Mentor</option>
              <option value="others">Others</option>
            </select>
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


