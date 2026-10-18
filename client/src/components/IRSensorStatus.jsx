import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5252/api").replace(/\/$/, "");
const DEVICE_ID = import.meta.env.VITE_IR_DEVICE_ID || "ESP32-01";

export default function IRSensorStatus() {
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      try {
        const response = await fetch(`${API_BASE}/iot/ir-status/${encodeURIComponent(DEVICE_ID)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);

        const data = Array.isArray(result.data) ? result.data : [result.data];
        if (active) {
          setStatuses(data);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && statuses.length === 0) {
    return <p className="text-slate-400">Loading parking sensors...</p>;
  }

  if (error && statuses.length === 0) {
    return <p className="text-danger">Unable to load parking sensors: {error}</p>;
  }

  if (statuses.length === 0) {
    return <p className="text-slate-500">No parking sensor status available yet.</p>;
  }

  return (
    <section className="card">
      <h2 className="font-semibold mb-3">Smart Parking Sensors</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statuses.map((status) => (
          <article key={status.slotId || status.deviceId} className="rounded-lg border border-slate-700 p-4">
            <p className="text-sm text-slate-400">
              Slot {status.slotId || "Sensor"} · Device {status.parentDeviceId || status.deviceId}
            </p>
            <h3 className="text-xl font-bold mt-3">
              {status.detected ? "Vehicle Detected · Occupied" : "Slot Available"}
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Last updated: {new Date(status.lastUpdated).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
      {error && (
        <p className="text-danger text-sm mt-3">
          Refresh failed: {error}. Showing the last successfully retrieved readings.
        </p>
      )}
    </section>
  );
}
