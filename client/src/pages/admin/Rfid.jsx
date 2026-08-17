import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Nfc, RefreshCw, XCircle, Trash2, History } from "lucide-react";

const AdminRfid = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scanHistory, setScanHistory] = useState([]);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/rfid");
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Simulated scan history — real entries would stream in from the ESP32 gate reader
    const now = Date.now();
    setScanHistory(
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        time: new Date(now - i * 45 * 60 * 1000).toLocaleString(),
        status: i % 4 === 3 ? "denied" : "granted",
      }))
    );
  }, []);

  const assign = async (u) => {
    const rfid = window.prompt(`Enter RFID Card ID to assign to ${u.fullName}`, u.rfidCardId || "");
    if (rfid === null || !rfid.trim()) return;
    setError("");
    try {
      await api.post(`/admin/rfid/${u._id}/assign`, { rfidCardId: rfid.trim() });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign RFID");
    }
  };

  const deactivate = async (u) => {
    await api.put(`/admin/rfid/${u._id}/deactivate`);
    load();
  };

  const unassign = async (u) => {
    if (!window.confirm(`Unassign RFID card from ${u.fullName}? (use this for a lost card)`)) return;
    await api.delete(`/admin/rfid/${u._id}`);
    load();
  };

  const statusBadge = {
    active: "text-primary",
    inactive: "text-orange-400",
    unassigned: "text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Nfc className="w-6 h-6 text-primary" /> RFID Management</h1>
        <p className="text-slate-400 text-sm mt-1">Register, assign, replace, and deactivate RFID cards for gate access.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded">{error}</div>}

      <div className="glass-card">
        <h2 className="font-semibold mb-4">Registered Cards</h2>
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-base-border">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Vehicle</th>
                  <th className="py-2 pr-4">RFID Card ID</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-base-border/50 hover:bg-white/[0.02]">
                    <td className="py-2 pr-4">{u.fullName}<br /><span className="text-slate-500 text-xs">{u.email}</span></td>
                    <td className="py-2 pr-4">{u.vehicleNumber || "-"}</td>
                    <td className="py-2 pr-4 font-mono">{u.rfidCardId || "-"}</td>
                    <td className={`py-2 pr-4 capitalize ${statusBadge[u.rfidStatus]}`}>{u.rfidStatus}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-3">
                        <button onClick={() => assign(u)} title={u.rfidCardId ? "Replace card" : "Register / Assign card"} className="text-secondary hover:opacity-80">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {u.rfidCardId && (
                          <>
                            <button onClick={() => deactivate(u)} title="Deactivate" className="text-orange-400 hover:opacity-80">
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => unassign(u)} title="Lost card / unassign" className="text-danger hover:opacity-80">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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

      <div className="glass-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><History className="w-4 h-4 text-primary" /> RFID Scan History</h2>
        <p className="text-slate-500 text-xs mb-3">
          Demo data — connect an ESP32 + RFID reader at the gate to populate this with real scans.
        </p>
        <ul className="space-y-2">
          {scanHistory.map((s) => (
            <li key={s.id} className="flex justify-between text-sm border-b border-base-border/50 pb-2">
              <span className="text-slate-400">{s.time}</span>
              <span className={s.status === "granted" ? "text-primary" : "text-danger"}>
                {s.status === "granted" ? "Access Granted" : "Access Denied"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminRfid;
