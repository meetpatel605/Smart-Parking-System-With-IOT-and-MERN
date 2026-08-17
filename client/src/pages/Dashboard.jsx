import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [slotsRes, bookingsRes, notifRes] = await Promise.all([
          api.get("/slots"),
          api.get("/bookings/mine"),
          api.get("/notifications"),
        ]);
        setSlots(slotsRes.data.slots);
        setBookings(bookingsRes.data.bookings);
        setNotifications(notifRes.data.notifications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const available = slots.filter((s) => s.status === "available").length;
  const occupied = slots.filter((s) => s.status === "occupied").length;
  const todaysBookings = bookings.filter((b) => b.date === today).length;
  const upcoming = bookings.filter((b) => b.date >= today && b.status === "confirmed").length;

  const cards = [
    { label: "Available Slots", value: available, color: "text-primary" },
    { label: "Occupied Slots", value: occupied, color: "text-danger" },
    { label: "Today's Bookings", value: todaysBookings, color: "text-secondary" },
    { label: "Upcoming Bookings", value: upcoming, color: "text-orange-400" },
    { label: "Total Bookings", value: bookings.length, color: "text-slate-200" },
    { label: "Notifications", value: notifications.filter((n) => !n.isRead).length, color: "text-primary" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Welcome, {user?.fullName} 👋</h1>
      <p className="text-slate-400 text-sm mb-8 capitalize">{user?.userType} Dashboard</p>

      {loading ? (
        <p className="text-slate-400">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {cards.map((c) => (
              <div key={c.label} className="card text-center">
                <div className={`text-3xl font-extrabold ${c.color}`}>{c.value}</div>
                <div className="text-slate-400 text-sm mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-10 flex-wrap">
            <Link to="/parking" className="btn-primary">Book a Slot</Link>
            <Link to="/history" className="btn-secondary">View Booking History</Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold mb-3">Recent Notifications</h2>
              {notifications.length === 0 ? (
                <p className="text-slate-500 text-sm">No notifications yet.</p>
              ) : (
                <ul className="space-y-2">
                  {notifications.slice(0, 5).map((n) => (
                    <li key={n._id} className="text-sm border-b border-base-border pb-2">
                      <span className="font-medium">{n.title}</span>
                      <p className="text-slate-400">{n.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold mb-3">Upcoming Bookings</h2>
              {bookings.filter((b) => b.date >= today && b.status === "confirmed").length === 0 ? (
                <p className="text-slate-500 text-sm">No upcoming bookings.</p>
              ) : (
                <ul className="space-y-2">
                  {bookings
                    .filter((b) => b.date >= today && b.status === "confirmed")
                    .slice(0, 5)
                    .map((b) => (
                      <li key={b._id} className="text-sm border-b border-base-border pb-2">
                        <span className="font-medium">Slot {b.slot?.slotNumber}</span> — {b.date}, {b.startTime}–{b.endTime}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
