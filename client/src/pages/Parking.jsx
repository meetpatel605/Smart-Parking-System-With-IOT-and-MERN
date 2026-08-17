import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ParkingSlotCard from "../components/ParkingSlotCard";

const Parking = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "11:00",
    vehicleNumber: (user?.vehicles && user.vehicles.length > 0) ? user.vehicles[0].number : (user?.vehicleNumber || ""),
  });
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);

  const loadAllSlots = async () => {
    const { data } = await api.get("/slots");
    setSlots(data.slots);
  };

  useEffect(() => {
    loadAllSlots();
  }, []);

  const findAvailable = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSelectedSlot(null);
    setSearching(true);
    try {
      const { data } = await api.get("/slots/available", { params: form });
      setSlots(data.slots);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;
    setError("");
    setBooking(true);
    try {
      await api.post("/bookings", {
        slotId: selectedSlot._id,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        vehicleNumber: form.vehicleNumber,
      });
      setMessage(`✅ Slot ${selectedSlot.slotNumber} booked successfully for ${form.date}, ${form.startTime}–${form.endTime}!`);
      setSelectedSlot(null);
      await loadAllSlots();
      setSearched(false);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Live Parking & Booking</h1>
      <p className="text-slate-400 text-sm mb-8">
        🟢 Available &nbsp; 🔴 Occupied &nbsp; 🟠 Reserved &nbsp; ⚪ Maintenance
      </p>

      <form onSubmit={findAvailable} className="card mb-8 grid sm:grid-cols-5 gap-4 items-end">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" required value={form.date} min={new Date().toISOString().slice(0,10)} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Start Time</label>
          <input type="time" className="input" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </div>
        <div>
          <label className="label">End Time</label>
          <input type="time" className="input" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>
        <div>
          <label className="label">Vehicle Number</label>
          {user?.vehicles && user.vehicles.length > 0 ? (
            <select className="input" required value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}>
              {user.vehicles.map((v, i) => (
                <option key={i} value={v.number}>{v.number} {v.label ? `(${v.label})` : ""}</option>
              ))}
            </select>
          ) : (
            <input className="input" required value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          )}
        </div>
        <button className="btn-primary h-fit" disabled={searching}>
          {searching ? "Searching..." : "Find Available Slots"}
        </button>
      </form>

      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded mb-4">{error}</div>}
      {message && <div className="bg-primary/10 border border-primary text-primary text-sm p-2 rounded mb-4">{message}</div>}

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">
            {searched ? "Available Slots for Selected Time" : "Parking Layout (Current Status)"}
          </h2>
          {searched && (
            <button onClick={() => { setSearched(false); loadAllSlots(); }} className="text-sm text-primary">
              Show full layout
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {slots.map((slot) => (
            <ParkingSlotCard
              key={slot._id}
              slot={searched ? { ...slot, status: "available" } : slot}
              selected={selectedSlot?._id === slot._id}
              onClick={(s) => {
                if (searched) setSelectedSlot(s);
              }}
            />
          ))}
        </div>

        {slots.length === 0 && <p className="text-slate-500 text-sm mt-4">No slots found.</p>}
      </div>

      {selectedSlot && (
        <div className="card mt-6">
          <h2 className="font-semibold mb-3">Slot Details — {selectedSlot.slotNumber}</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-4">
            <p>Zone: {selectedSlot.zone}</p>
            <p>Nearest Gate: {selectedSlot.nearestGate}</p>
            <p>Charging Available: {selectedSlot.chargingAvailable ? "Yes" : "No"}</p>
            <p>Covered Parking: {selectedSlot.covered ? "Yes" : "No"}</p>
            <p>Category: {selectedSlot.category}</p>
          </div>
          <button className="btn-primary" onClick={confirmBooking} disabled={booking}>
            {booking ? "Booking..." : `Confirm Booking for ${form.date} (${form.startTime}–${form.endTime})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Parking;
