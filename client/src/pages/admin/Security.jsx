import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, KeyRound, History, Activity } from "lucide-react";

const AdminSecurity = () => {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [loginHistory, setLoginHistory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    api.get("/admin/login-history").then((res) => setLoginHistory(res.data.logs));
    api.get("/admin/activity-logs", { params: { limit: 30 } }).then((res) => setActivityLogs(res.data.logs));
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwMsg("");
    try {
      await api.put("/auth/change-password", pwForm);
      setPwMsg("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwError(err.response?.data?.message || "Change failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" /> Security</h1>
        <p className="text-slate-400 text-sm mt-1">Admin profile, password, and system activity audit trail.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card">
          <h2 className="font-semibold mb-4">Admin Profile</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">Name:</span> {user?.fullName}</p>
            <p><span className="text-slate-500">Email:</span> {user?.email}</p>
            <p><span className="text-slate-500">Role:</span> Administrator</p>
            <p><span className="text-slate-500">Mobile:</span> {user?.mobile}</p>
          </div>
        </div>

        <form onSubmit={changePassword} className="glass-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change Password</h2>
          {pwError && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded">{pwError}</div>}
          {pwMsg && <div className="bg-primary/10 border border-primary text-primary text-sm p-2 rounded">{pwMsg}</div>}
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" required value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <button className="btn-primary">Change Password</button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Login History</h2>
          {loginHistory.length === 0 ? (
            <p className="text-slate-500 text-sm">No login history yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {loginHistory.map((l) => (
                <li key={l._id} className="text-sm border-b border-base-border/50 pb-2">
                  <p>{l.userLabel}</p>
                  <p className="text-slate-500 text-xs">{new Date(l.createdAt).toLocaleString()} {l.ip ? `• ${l.ip}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Activity Logs</h2>
          {activityLogs.length === 0 ? (
            <p className="text-slate-500 text-sm">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activityLogs.map((l) => (
                <li key={l._id} className="text-sm border-b border-base-border/50 pb-2">
                  <p className="capitalize">{l.action.replace(/_/g, " ")} — <span className="text-slate-400">{l.details}</span></p>
                  <p className="text-slate-500 text-xs">{new Date(l.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
