import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Search } from "lucide-react";

const statusColor = {
  confirmed: "text-primary",
  pending: "text-orange-400",
  cancelled: "text-danger",
  completed: "text-secondary",
  expired: "text-slate-500",
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
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

  const filtered = bookings.filter((b) =>
    search
      ? b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
        b.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        b.slot?.slotNumber?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <p className="text-slate-400 text-sm mt-1">View, search, and update every booking in the system.</p>
      </div>

      <div className="glass-card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-9" placeholder="Search code, user, slot..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

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
                  <th className="py-2 pr-4">Vehicle</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id} className="border-b border-base-border/50 hover:bg-white/[0.02]">
                    <td className="py-2 pr-4">{b.bookingCode}</td>
                    <td className="py-2 pr-4">{b.user?.fullName}</td>
                    <td className="py-2 pr-4">{b.slot?.slotNumber}</td>
                    <td className="py-2 pr-4">{b.date} {b.startTime}-{b.endTime}</td>
                    <td className="py-2 pr-4">{b.vehicleNumber}</td>
                    <td className={`py-2 pr-4 capitalize font-medium ${statusColor[b.status]}`}>{b.status}</td>
                    <td className="py-2 pr-4 flex gap-3">
                      <button onClick={() => setBookingStatus(b, "completed")} className="text-secondary hover:underline">Complete</button>
                      <button onClick={() => setBookingStatus(b, "cancelled")} className="text-danger hover:underline">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-slate-500 mt-4">No bookings found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
