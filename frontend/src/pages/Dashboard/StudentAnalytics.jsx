import React from "react";
import { useNavigate } from "react-router-dom";

export default function StudentAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-lg font-semibold text-slate-50">Analytics</h1>
      <p className="text-sm text-slate-400 mt-2">
        Deeper analytics (skills, applications, collaboration trends) will plug in here. For
        now, use{" "}
        <button
          type="button"
          onClick={() => navigate("/student/contributions")}
          className="text-sky-400 hover:underline"
        >
          Contributions &amp; Rewards
        </button>{" "}
        for GitHub activity and points.
      </p>
      <div className="mt-8 h-40 rounded-2xl border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-sm">
        Chart placeholder
      </div>
    </div>
  );
}
