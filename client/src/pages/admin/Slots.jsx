import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Plus, Trash2, Zap, Umbrella } from "lucide-react";

const emptySlotForm = { slotNumber: "", zone: "A", nearestGate: "Main Gate", chargingAvailable: false, covered: false, category: "general" };

const statusStyles = {
  available: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  occupied: "border-red-500/50 bg-red-500/10 text-red-400",
  reserved: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  maintenance: "border-slate-500/50 bg-slate-500/10 text-slate-400",
};

const AdminSlots = () => {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(emptySlotForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add slot");
    }
  };

  const updateStatus = async (slot, status) => {
    await api.put(`/slots/${slot._id}`, { status });
    load();
  };

  const deleteSlot = async (slot) => {
    if (!window.confirm(`Delete slot ${slot.slotNumber}?`)) return;
    await api.delete(`/slots/${slot._id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Parking Slot Management</h1>
          <p className="text-slate-400 text-sm mt-1">Add, edit, and monitor every parking slot.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>

      {showForm && (
        <form onSubmit={addSlot} className="glass-card grid sm:grid-cols-6 gap-3 items-end">
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
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" checked={form.covered} onChange={(e) => setForm({ ...form, covered: e.target.checked })} /> Covered
          </label>
          <button className="btn-primary sm:col-span-6 w-fit">Save Slot</button>
        </form>
      )}

      <div className="glass-card">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((s) => (
              <div key={s._id} className={`border rounded-xl p-3 text-center text-sm ${statusStyles[s.status]}`}>
                <p className="font-bold text-slate-100">{s.slotNumber}</p>
                <p className="text-[11px] text-slate-400 mb-2">{s.zone} • {s.nearestGate}</p>
                <div className="flex justify-center gap-1 mb-2 text-slate-400">
                  {s.chargingAvailable && <Zap className="w-3 h-3" />}
                  {s.covered && <Umbrella className="w-3 h-3" />}
                </div>
                <select
                  className="input text-xs mb-2 py-1"
                  value={s.status}
                  onChange={(e) => updateStatus(s, e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <button onClick={() => deleteSlot(s)} className="text-danger text-xs hover:underline flex items-center gap-1 mx-auto">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
        {!loading && slots.length === 0 && <p className="text-slate-500 text-sm">No slots yet — add one above.</p>}
      </div>
    </div>
  );
};

export default AdminSlots;
