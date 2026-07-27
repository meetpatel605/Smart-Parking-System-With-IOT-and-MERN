import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Bell, Send, History } from "lucide-react";

const AdminNotifications = () => {
  const [form, setForm] = useState({ title: "", message: "", target: "all" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    const { data } = await api.get("/admin/notifications/history");
    setHistory(data.logs);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const send = async (e) => {
    e.preventDefault();
    setError("");
    setResult("");
    setSending(true);
    try {
      const { data } = await api.post("/admin/notifications/broadcast", form);
      setResult(data.message);
      setForm({ title: "", message: "", target: "all" });
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-primary" /> Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">Send announcements to all users or a specific group.</p>
      </div>

      <form onSubmit={send} className="glass-card space-y-4 max-w-xl">
        <h2 className="font-semibold">Send Announcement / Email Notification</h2>
        {error && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded">{error}</div>}
        {result && <div className="bg-primary/10 border border-primary text-primary text-sm p-2 rounded">{result}</div>}

        <div>
          <label className="label">Title</label>
          <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" rows="4" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <div>
          <label className="label">Send To</label>
          <select className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
            <option value="all">All Users</option>
            <option value="student">Students Only</option>
            <option value="faculty">Faculty Only</option>
          </select>
        </div>
        <p className="text-xs text-slate-500">
          Delivered as in-app notifications to matching users right now. Wire up an SMTP provider under
          System Settings to also send real emails.
        </p>
        <button className="btn-primary flex items-center gap-2" disabled={sending}>
          <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Notification"}
        </button>
      </form>

      <div className="glass-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Notification History</h2>
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm">No notifications sent yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h._id} className="text-sm border-b border-base-border/50 pb-2">
                <p>{h.details}</p>
                <p className="text-slate-500 text-xs">{new Date(h.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
