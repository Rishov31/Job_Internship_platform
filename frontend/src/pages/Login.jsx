import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loginUser(form);
      navigate("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <div className="text-sky-600 font-extrabold text-xl">INTERNSHALA</div>
          <h1 className="mt-2 text-2xl font-bold">Login</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back! Please sign in.</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-600 text-white rounded-md py-2 font-medium hover:bg-sky-700 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          New here? <Link to="/register" className="text-sky-700 font-medium">Create an account</Link>
        </div>
      </div>
    </div>
  );
}


