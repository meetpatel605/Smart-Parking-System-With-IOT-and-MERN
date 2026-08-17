import React from "react";
import { Radio, Cpu, Wifi, AlertTriangle } from "lucide-react";

const devices = [
  { id: 1, name: "ESP32 — Main Gate", type: "Controller", status: "offline", icon: Cpu },
  { id: 2, name: "IR Sensor — Entry", type: "Sensor", status: "offline", icon: Radio },
  { id: 3, name: "IR Sensor — Exit", type: "Sensor", status: "offline", icon: Radio },
  { id: 4, name: "RFID Reader — Main Gate", type: "Reader", status: "offline", icon: Radio },
  { id: 5, name: "WiFi Module", type: "Network", status: "offline", icon: Wifi },
];

const AdminSensors = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Radio className="w-6 h-6 text-primary" /> Sensor Monitoring</h1>
        <p className="text-slate-400 text-sm mt-1">Hardware connection status and device health.</p>
      </div>

      <div className="glass-card border-orange-500/30 flex items-start gap-3 text-sm">
        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-slate-300">
          All devices show as Offline because no physical ESP32/sensor hardware is connected to this
          deployment yet. Once hardware pings a heartbeat endpoint, this page can reflect live status.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => (
          <div key={d.id} className="glass-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-500/15 text-slate-400 flex items-center justify-center shrink-0">
              <d.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{d.name}</p>
              <p className="text-xs text-slate-500">{d.type}</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-red-400 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Offline
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSensors;
