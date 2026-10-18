import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { createSocket } from "../../api/socket";
import { Radio, Cpu, Wifi, AlertTriangle } from "lucide-react";

const AdminSensors = () => {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/hardware/devices")
      .then(({ data }) => active && setDevices(data.devices))
      .catch((err) => active && setError(err.response?.data?.message || "Unable to load device status"));
    const socket = createSocket();
    socket.on("device:status", (device) => {
      if (!active) return;
      setDevices((current) => {
        const next = current.filter((item) => item.deviceId !== device.deviceId);
        return [...next, device].sort((a, b) => a.deviceId.localeCompare(b.deviceId));
      });
    });
    return () => {
      active = false;
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Radio className="w-6 h-6 text-primary" /> Sensor Monitoring</h1>
        <p className="text-slate-400 text-sm mt-1">Hardware connection status and device health.</p>
      </div>

      <div className="glass-card border-orange-500/30 flex items-start gap-3 text-sm">
        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-slate-300">
          Devices are marked online only when a recent MQTT heartbeat is received. Configure
          <code className="mx-1 text-primary">MQTT_URL</code> on the backend before connecting hardware.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => (
          <div key={d.deviceId} className="glass-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-500/15 text-slate-400 flex items-center justify-center shrink-0">
              {d.type === "gate" ? <Cpu className="w-5 h-5" /> : d.type === "slot_sensor" ? <Radio className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{d.name || d.deviceId}</p>
              <p className="text-xs text-slate-500">{d.type}</p>
            </div>
            <span className={`flex items-center gap-1.5 text-xs shrink-0 ${d.status === "online" ? "text-primary" : "text-red-400"}`}>
              <span className={`w-2 h-2 rounded-full ${d.status === "online" ? "bg-primary" : "bg-red-500"}`} /> {d.status}
            </span>
          </div>
        ))}
      </div>
      {error && <p className="text-danger text-sm">{error}</p>}
      {!error && devices.length === 0 && <p className="text-slate-500 text-sm">No devices have reported a heartbeat yet.</p>}
    </div>
  );
};

export default AdminSensors;
