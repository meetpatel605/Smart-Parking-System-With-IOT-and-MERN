import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    mobile: user?.mobile || "",
    vehicleNumber: user?.vehicleNumber || "",
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
          <label className="label">Vehicle Number</label>
          <input className="input" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
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
