import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function ContributionGithubChart({
  data = [],
  loading,
  emptyMessage,
}) {
  if (loading) {
    return (
      <div className="h-44 flex items-center justify-center text-[11px] text-slate-500">
        Loading GitHub activity…
      </div>
    );
  }

  if (!data.length || data.every((d) => !d.count)) {
    return (
      <div className="h-44 flex items-center justify-center text-center px-2 text-[11px] text-slate-500">
        {emptyMessage || "No commits in the last 14 days on tracked startup repos."}
      </div>
    );
  }

  return (
    <div className="h-44 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="ghBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#94a3b8", fontSize: 9 }}
            axisLine={{ stroke: "#475569" }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#94a3b8", fontSize: 9 }}
            axisLine={{ stroke: "#475569" }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value) => [`${value} commits/PRs`, "Activity"]}
          />
          <Bar
            dataKey="count"
            fill="url(#ghBarGrad)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
