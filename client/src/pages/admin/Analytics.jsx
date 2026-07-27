import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a78bfa"];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("daily"); // daily | weekly | monthly

  useEffect(() => {
    api.get("/admin/analytics").then((res) => setData(res.data));
  }, []);

  const groupedTrends = useMemo(() => {
    if (!data) return [];
    if (period === "daily") return data.bookingTrends;

    const groups = {};
    data.bookingTrends.forEach(({ date, count }) => {
      const d = new Date(date);
      let key;
      if (period === "weekly") {
        const firstDay = new Date(d);
        firstDay.setDate(d.getDate() - d.getDay());
        key = firstDay.toISOString().slice(0, 10);
      } else {
        key = date.slice(0, 7); // YYYY-MM
      }
      groups[key] = (groups[key] || 0) + count;
    });
    return Object.entries(groups).map(([date, count]) => ({ date, count }));
  }, [data, period]);

  if (!data) return <p className="text-slate-400">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Occupancy trends, peak hours, and slot usage insights.</p>
        </div>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                period === p ? "bg-primary text-white" : "bg-base-card text-slate-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card">
          <h2 className="font-semibold mb-4 capitalize">{period} Booking Trends</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={groupedTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h2 className="font-semibold mb-4">Peak Hour Analysis</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h2 className="font-semibold mb-4">Most Used Slots</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.mostUsedSlots} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="slot" stroke="#94a3b8" fontSize={11} width={50} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h2 className="font-semibold mb-4">Occupancy / Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                {data.statusBreakdown.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
