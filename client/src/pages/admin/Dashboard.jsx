import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import StatCard from "../../components/StatCard";
import {
  Users, ParkingSquare, CheckCircle2, XCircle, BookmarkCheck, CalendarDays,
  Car, ArrowRightLeft, Activity,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    api.get("/admin/stats").then((res) => setStats(res.data));
    api.get("/admin/analytics").then((res) => setTrend(res.data.bookingTrends || []));
  }, []);

  if (!stats) return <p className="text-slate-400">Loading dashboard...</p>;

  const cards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "primary" },
    { icon: ParkingSquare, label: "Total Parking Slots", value: stats.totalSlots, color: "secondary" },
    { icon: CheckCircle2, label: "Available Slots", value: stats.availableSlots, color: "primary" },
    { icon: XCircle, label: "Occupied Slots", value: stats.occupiedSlots, color: "danger" },
    { icon: BookmarkCheck, label: "Reserved Slots", value: stats.reservedSlots, color: "orange" },
    { icon: CalendarDays, label: "Today's Bookings", value: stats.todaysBookings, color: "secondary" },
    { icon: Car, label: "Active Vehicles (today)", value: stats.activeVehicles, color: "primary" },
    { icon: ArrowRightLeft, label: "Entries / Exits Today", value: `${stats.entryExitStats.entriesToday} / ${stats.entryExitStats.exitsToday}`, color: "purple" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Live snapshot of the parking system.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card lg:col-span-2">
          <h2 className="font-semibold mb-4">Booking Trends (last 14 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Recent Activity
          </h2>
          {stats.recentActivities?.length === 0 ? (
            <p className="text-slate-500 text-sm">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {stats.recentActivities.map((a) => (
                <li key={a._id} className="text-sm border-b border-base-border/60 pb-2">
                  <p className="font-medium capitalize">{a.action.replace(/_/g, " ")}</p>
                  <p className="text-slate-500 text-xs">{a.details}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
