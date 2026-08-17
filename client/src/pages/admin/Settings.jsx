import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Settings, Plus, Trash2 } from "lucide-react";

const AdminSettings = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newHoliday, setNewHoliday] = useState({ date: "", label: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/settings");
    setForm(data.settings);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const { data } = await api.put("/admin/settings", form);
      setForm(data.settings);
      setMsg("Settings saved successfully!");
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.label) return;
    setForm({ ...form, holidays: [...(form.holidays || []), newHoliday] });
    setNewHoliday({ date: "", label: "" });
  };

  const removeHoliday = (idx) => {
    setForm({ ...form, holidays: form.holidays.filter((_, i) => i !== idx) });
  };

  if (loading || !form) return <p className="text-slate-400">Loading settings...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure parking timings, booking rules, and holidays.</p>
      </div>

      <form onSubmit={save} className="glass-card space-y-6 max-w-2xl">
        {msg && <div className="bg-primary/10 border border-primary text-primary text-sm p-2 rounded">{msg}</div>}

        <div>
          <h2 className="font-semibold mb-3">Parking Timings</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Open Time</label>
              <input type="time" className="input" value={form.parkingOpenTime} onChange={(e) => setForm({ ...form, parkingOpenTime: e.target.value })} />
            </div>
            <div>
              <label className="label">Close Time</label>
              <input type="time" className="input" value={form.parkingCloseTime} onChange={(e) => setForm({ ...form, parkingCloseTime: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Booking Rules</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Max Duration (hrs)</label>
              <input type="number" min="1" className="input" value={form.maxBookingDurationHours} onChange={(e) => setForm({ ...form, maxBookingDurationHours: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Min Duration (mins)</label>
              <input type="number" min="10" className="input" value={form.minBookingDurationMinutes} onChange={(e) => setForm({ ...form, minBookingDurationMinutes: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Max Advance Booking (days)</label>
              <input type="number" min="1" className="input" value={form.maxAdvanceBookingDays} onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: Number(e.target.value) })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mt-3">
            <input type="checkbox" checked={form.allowOverlapWaitlist} onChange={(e) => setForm({ ...form, allowOverlapWaitlist: e.target.checked })} />
            Allow users to join a waiting list when a slot is fully booked
          </label>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Holiday Settings</h2>
          <div className="flex gap-2 mb-3 flex-wrap">
            <input type="date" className="input max-w-[160px]" value={newHoliday.date} onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })} />
            <input placeholder="Label (e.g. Diwali)" className="input max-w-[200px]" value={newHoliday.label} onChange={(e) => setNewHoliday({ ...newHoliday, label: e.target.value })} />
            <button type="button" onClick={addHoliday} className="btn-secondary flex items-center gap-1 text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <ul className="space-y-1">
            {(form.holidays || []).map((h, i) => (
              <li key={i} className="flex items-center justify-between text-sm border-b border-base-border/50 pb-1">
                <span>{h.date} — {h.label}</span>
                <button type="button" onClick={() => removeHoliday(i)} className="text-danger">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
            {(!form.holidays || form.holidays.length === 0) && <p className="text-slate-500 text-sm">No holidays added.</p>}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Email Configuration</h2>
          <div>
            <label className="label">Contact / Support Email</label>
            <input type="email" className="input max-w-sm" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 mt-3">
            <input type="checkbox" checked={form.smtpConfigured} onChange={(e) => setForm({ ...form, smtpConfigured: e.target.checked })} />
            SMTP provider configured (enables real email delivery for notifications)
          </label>
        </div>

        <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
      </form>
    </div>
  );
};

export default AdminSettings;
