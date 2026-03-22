import React from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

/**
 * @param {{ month: string, cumulative: number, points: number }[]} data
 */
export default function StartupPointsLineChart({ data = [], loading }) {
  if (loading) {
    return (
      <div className="h-52 flex items-center justify-center text-[11px] text-slate-500">
        Loading startup points…
      </div>
    );
  }

  if (!data.length || data.every((d) => d.cumulative === 0 && d.points === 0)) {
    return (
      <div className="h-52 flex items-center justify-center text-center px-3 text-[11px] text-slate-500 leading-relaxed">
        No startup points yet. When a founder approves your contribution and awards
        points, your growth line appears here.
      </div>
    );
  }

  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="startupPointsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.45} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "#475569" }}
            tickLine={{ stroke: "#475569" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "#475569" }}
            tickLine={{ stroke: "#475569" }}
            width={36}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload;
              return (
                <div className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-[11px] shadow-xl">
                  <div className="font-medium text-slate-100">{label}</div>
                  {row.points > 0 && (
                    <div className="mt-1 text-emerald-400">
                      +{row.points} pts awarded this month
                    </div>
                  )}
                  <div className="mt-1 text-sky-300">
                    {row.cumulative} pts total (running)
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#38bdf8"
            strokeWidth={2.5}
            fill="url(#startupPointsFill)"
            dot={{ fill: "#38bdf8", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: "#7dd3fc", stroke: "#0ea5e9" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
