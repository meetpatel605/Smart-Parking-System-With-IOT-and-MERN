import React, { useEffect, useState } from "react";
import api from "../api/axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a78bfa"];

const TABS = ["Overview", "Users", "Slots", "Bookings", "Analytics"];

const Admin = () => {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    const { data } = await api.get("/admin/stats");
    setStats(data);
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === t ? "bg-primary text-white" : "bg-base-card text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview stats={stats} />}
      {tab === "Users" && <Users />}
      {tab === "Slots" && <Slots onChange={loadStats} />}
      {tab === "Bookings" && <Bookings onChange={loadStats} />}
      {tab === "Analytics" && <Analytics />}
    </div>
  );
};

const Overview = ({ stats }) => {
  if (!stats) return <p className="text-slate-400">Loading...</p>;
  const cards = [
    ["Total Users", stats.totalUsers],
    ["Total Slots", stats.totalSlots],
    ["Available Slots", stats.availableSlots],
    ["Occupied Slots", stats.occupiedSlots],
    ["Today's Bookings", stats.todaysBookings],
    ["Total Bookings", stats.totalBookings],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map(([label, value]) => (
        <div key={label} className="card text-center">
          <div className="text-3xl font-extrabold text-primary">{value}</div>
          <div className="text-slate-400 text-sm mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/users", { params: { search } });
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleBlock = async (u) => {
    await api.put(`/admin/users/${u._id}`, { isBlocked: !u.isBlocked });
    load();
  };

  const assignRfid = async (u) => {
    const rfid = window.prompt("Enter RFID Card ID for " + u.fullName, u.rfidCardId || "");
    if (rfid === null) return;
    await api.put(`/admin/users/${u._id}`, { rfidCardId: rfid });
    load();
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete user ${u.fullName}?`)) return;
    await api.delete(`/admin/users/${u._id}`);
    load();
  };

  return (
    <div className="card">
      <input
        className="input max-w-xs mb-4"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-base-border">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">RFID</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-base-border/50">
                  <td className="py-2 pr-4">{u.fullName}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4 capitalize">{u.userType}</td>
                  <td className="py-2 pr-4">{u.vehicleNumber || "-"}</td>
                  <td className="py-2 pr-4">{u.rfidCardId || "-"}</td>
                  <td className="py-2 pr-4">
                    <span className={u.isBlocked ? "text-danger" : "text-primary"}>
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 flex gap-2 flex-wrap">
                    <button onClick={() => assignRfid(u)} className="text-secondary hover:underline">RFID</button>
                    <button onClick={() => toggleBlock(u)} className="text-orange-400 hover:underline">
                      {u.isBlocked ? "Unblock" : "Block"}
                    </button>
                    <button onClick={() => deleteUser(u)} className="text-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-slate-500 mt-4">No users found.</p>}
        </div>
      )}
    </div>
  );
};

const emptySlotForm = { slotNumber: "", zone: "A", nearestGate: "Main Gate", chargingAvailable: false, covered: false, category: "general" };

const Slots = ({ onChange }) => {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(emptySlotForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/slots");
    setSlots(data.slots);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addSlot = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/slots", form);
      setForm(emptySlotForm);
      load();
      onChange && onChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add slot");
    }
  };

  const updateStatus = async (slot, status) => {
    await api.put(`/slots/${slot._id}`, { status });
    load();
    onChange && onChange();
  };

  const deleteSlot = async (slot) => {
    if (!window.confirm(`Delete slot ${slot.slotNumber}?`)) return;
    await api.delete(`/slots/${slot._id}`);
    load();
    onChange && onChange();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addSlot} className="card grid sm:grid-cols-6 gap-3 items-end">
        {error && <p className="sm:col-span-6 text-danger text-sm">{error}</p>}
        <div>
          <label className="label">Slot #</label>
          <input className="input" required value={form.slotNumber} onChange={(e) => setForm({ ...form, slotNumber: e.target.value })} />
        </div>
        <div>
          <label className="label">Zone</label>
          <input className="input" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
        </div>
        <div>
          <label className="label">Nearest Gate</label>
          <input className="input" value={form.nearestGate} onChange={(e) => setForm({ ...form, nearestGate: e.target.value })} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">General</option>
            <option value="faculty">Faculty</option>
            <option value="disabled">Disabled</option>
            <option value="ev">EV</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={form.chargingAvailable} onChange={(e) => setForm({ ...form, chargingAvailable: e.target.checked })} /> Charging
        </label>
        <button className="btn-primary">Add Slot</button>
      </form>

      <div className="card">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {slots.map((s) => (
              <div key={s._id} className="border border-base-border rounded-lg p-3 text-center text-sm">
                <p className="font-bold">{s.slotNumber}</p>
                <select
                  className="input text-xs mt-2 mb-2 py-1"
                  value={s.status}
                  onChange={(e) => updateStatus(s, e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <button onClick={() => deleteSlot(s)} className="text-danger text-xs hover:underline">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/bookings", { params: status ? { status } : {} });
    setBookings(data.bookings);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const setBookingStatus = async (b, newStatus) => {
    await api.put(`/admin/bookings/${b._id}/status`, { status: newStatus });
    load();
  };

  return (
    <div className="card">
      <select className="input max-w-[200px] mb-4" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
        <option value="expired">Expired</option>
      </select>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-base-border">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Slot</th>
                <th className="py-2 pr-4">Date / Time</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b border-base-border/50">
                  <td className="py-2 pr-4">{b.bookingCode}</td>
                  <td className="py-2 pr-4">{b.user?.fullName}</td>
                  <td className="py-2 pr-4">{b.slot?.slotNumber}</td>
                  <td className="py-2 pr-4">{b.date} {b.startTime}-{b.endTime}</td>
                  <td className="py-2 pr-4 capitalize">{b.status}</td>
                  <td className="py-2 pr-4 flex gap-2 flex-wrap">
                    <button onClick={() => setBookingStatus(b, "completed")} className="text-secondary hover:underline">Complete</button>
                    <button onClick={() => setBookingStatus(b, "cancelled")} className="text-danger hover:underline">Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p className="text-slate-500 mt-4">No bookings found.</p>}
        </div>
      )}
    </div>
  );
};

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics").then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-slate-400">Loading analytics...</p>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="font-semibold mb-4">Booking Trends</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.bookingTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Peak Hours</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.peakHours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Most Used Slots</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.mostUsedSlots} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} />
            <YAxis type="category" dataKey="slot" stroke="#94a3b8" fontSize={11} width={50} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Status Breakdown</h2>
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
  );
};

export default Admin;
