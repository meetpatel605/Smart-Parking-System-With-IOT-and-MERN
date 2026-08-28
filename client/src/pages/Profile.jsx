import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const MAX_VEHICLES_PER_USER = 10;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const initialVehicles = (user?.vehicles && user.vehicles.length > 0)
    ? user.vehicles.map((v) => ({ number: v.number, type: v.type, label: v.label || "" }))
    : user?.vehicleNumber ? [{ number: user.vehicleNumber, type: user.vehicleType || "4-wheeler", label: "" }] : [];

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    mobile: user?.mobile || "",
    vehicles: initialVehicles,
    rfidCardId: user?.rfidCardId || "",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const { data } = await api.put("/auth/profile", form);
      updateUser(data.user);
      setMsg("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

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
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold">Profile</h1>

      <form onSubmit={saveProfile} className="card space-y-4">
        <h2 className="font-semibold text-lg">Edit Profile</h2>
        {error && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded">{error}</div>}
        {msg && <div className="bg-primary/10 border border-primary text-primary text-sm p-2 rounded">{msg}</div>}

        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="label">Email (read-only)</label>
          <input className="input opacity-60" value={user?.email} disabled />
        </div>
        <div>
          <label className="label">Mobile</label>
          <input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </div>
        <div>
          <label className="label">Vehicles</label>
          <div className="space-y-2">
            {form.vehicles.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className="col-span-5 input" placeholder="GJ01AB1234" value={v.number} onChange={(e) => {
                  const nv = [...form.vehicles]; nv[i].number = e.target.value.toUpperCase(); setForm({ ...form, vehicles: nv });
                }} />
                <select className="col-span-4 input" value={v.type} onChange={(e) => {
                  const nv = [...form.vehicles]; nv[i].type = e.target.value; setForm({ ...form, vehicles: nv });
                }}>
                  <option value="4-wheeler">4-Wheeler</option>
                  <option value="2-wheeler">2-Wheeler</option>
                  <option value="other">Other</option>
                </select>
                <input className="col-span-2 input" placeholder="Label" value={v.label} onChange={(e) => {
                  const nv = [...form.vehicles]; nv[i].label = e.target.value; setForm({ ...form, vehicles: nv });
                }} />
                <button type="button" className="col-span-1 text-danger" onClick={() => {
                  const nv = form.vehicles.filter((_, idx) => idx !== i); setForm({ ...form, vehicles: nv });
                }}>Remove</button>
              </div>
            ))}
            <div>
              <button
                type="button"
                className="btn-secondary"
                disabled={form.vehicles.length >= MAX_VEHICLES_PER_USER}
                onClick={() => setForm({ ...form, vehicles: [...form.vehicles, { number: "", type: "4-wheeler", label: "" }] })}
              >
                Add Vehicle
              </button>
              <p className="text-xs text-slate-400 mt-2">
                Maximum {MAX_VEHICLES_PER_USER} vehicles allowed per user.
              </p>
            </div>
          </div>
        </div>
        <div>
          <label className="label">RFID Card ID</label>
          <input className="input" value={form.rfidCardId} onChange={(e) => setForm({ ...form, rfidCardId: e.target.value })} />
        </div>
        <button className="btn-primary">Save Changes</button>
      </form>

      <form onSubmit={changePassword} className="card space-y-4">
        <h2 className="font-semibold text-lg">Change Password</h2>
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
        <button className="btn-secondary">Change Password</button>
      </form>
    </div>
  );
};

export default Profile;
