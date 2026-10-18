import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Search, Ban, CheckCircle, Trash2, Eye, X } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState(null);
  const [viewBookings, setViewBookings] = useState([]);

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

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete user ${u.fullName}? This cannot be undone.`)) return;
    await api.delete(`/admin/users/${u._id}`);
    load();
  };

  const openProfile = async (u) => {
    setViewUser(u);
    const { data } = await api.get("/admin/bookings");
    setViewBookings(data.bookings.filter((b) => b.user?._id === u._id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-slate-400 text-sm mt-1">Search users, manage vehicles, and view booking history.</p>
      </div>

      <div className="glass-card">
        <div className="relative max-w-xs mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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
                  <tr key={u._id} className="border-b border-base-border/50 hover:bg-white/[0.02]">
                    <td className="py-2 pr-4">{u.fullName}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4 capitalize">{u.userType}</td>
                    <td className="py-2 pr-4">{u.vehicleNumber || "-"} <span className="text-slate-500">({u.vehicleType || "-"})</span></td>
                    <td className="py-2 pr-4">{u.rfidCardId || <span className="text-slate-500">Unassigned</span>}</td>
                    <td className="py-2 pr-4">
                      <span className={u.isBlocked ? "text-danger" : "text-primary"}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-3">
                        <button onClick={() => openProfile(u)} title="View profile & bookings" className="text-secondary hover:opacity-80">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleBlock(u)} title={u.isBlocked ? "Unblock" : "Block"} className="text-orange-400 hover:opacity-80">
                          {u.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteUser(u)} title="Delete" className="text-danger hover:opacity-80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-slate-500 mt-4">No users found.</p>}
          </div>
        )}
      </div>

      {viewUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewUser(null)}>
          <div className="glass-card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-semibold text-lg">{viewUser.fullName}</h2>
                <p className="text-slate-400 text-sm">{viewUser.email}</p>
              </div>
              <button onClick={() => setViewUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              <p><span className="text-slate-500">Mobile:</span> {viewUser.mobile}</p>
              <p><span className="text-slate-500">Type:</span> {viewUser.userType}</p>
              <p><span className="text-slate-500">Vehicle:</span> {viewUser.vehicleNumber || "-"}</p>
              <p><span className="text-slate-500">Vehicle Type:</span> {viewUser.vehicleType || "-"}</p>
              <p><span className="text-slate-500">RFID:</span> {viewUser.rfidCardId || "Unassigned"}</p>
              <p><span className="text-slate-500">Joined:</span> {new Date(viewUser.createdAt).toLocaleDateString()}</p>
            </div>
            <h3 className="font-semibold mb-2 text-sm">Booking History</h3>
            {viewBookings.length === 0 ? (
              <p className="text-slate-500 text-sm">No bookings yet.</p>
            ) : (
              <ul className="space-y-2">
                {viewBookings.map((b) => (
                  <li key={b._id} className="text-sm border-b border-base-border/50 pb-2">
                    Slot {b.slot?.slotNumber} — {b.date}, {b.startTime}-{b.endTime}{" "}
                    <span className="text-slate-500 capitalize">({b.status})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
