import React, { useEffect, useState } from "react";
import api from "../api/axios";

const statusColor = {
  confirmed: "text-primary",
  pending: "text-orange-400",
  cancelled: "text-danger",
  completed: "text-secondary",
  expired: "text-slate-500",
};

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/bookings/mine");
    setBookings(data.bookings);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    await api.put(`/bookings/${id}/cancel`);
    load();
  };

  const filtered = bookings
    .filter((b) => (filter === "all" ? true : b.status === filter))
    .filter((b) =>
      search ? b.bookingCode.toLowerCase().includes(search.toLowerCase()) || b.slot?.slotNumber?.toLowerCase().includes(search.toLowerCase()) : true
    );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Booking History</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Search by booking code or slot..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-[180px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="confirmed">Upcoming / Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">No bookings found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b._id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold">
                  Slot {b.slot?.slotNumber} <span className="text-slate-500 text-xs">({b.bookingCode})</span>
                </p>
                <p className="text-slate-400 text-sm">
                  {b.date} • {b.startTime}–{b.endTime} • Vehicle: {b.vehicleNumber}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold capitalize ${statusColor[b.status]}`}>{b.status}</span>
                {b.status === "confirmed" && b.date >= today && (
                  <button onClick={() => cancelBooking(b._id)} className="btn-danger text-sm">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
