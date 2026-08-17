import React, { useState } from "react";
import { Camera, AlertTriangle } from "lucide-react";

const cams = [
  { id: 1, name: "Main Gate — Entry", zone: "Entry" },
  { id: 2, name: "Main Gate — Exit", zone: "Exit" },
  { id: 3, name: "Zone A Overview", zone: "Overview" },
  { id: 4, name: "Zone B Overview", zone: "Overview" },
];

const history = Array.from({ length: 6 }).map((_, i) => ({
  id: i,
  type: i % 2 === 0 ? "Entry" : "Exit",
  vehicle: `GJ01AB${1000 + i}`,
  time: new Date(Date.now() - i * 37 * 60 * 1000).toLocaleString(),
}));

const CameraFeed = ({ name }) => (
  <div className="rounded-xl overflow-hidden border border-base-border">
    <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-2 relative">
      <Camera className="w-8 h-8 text-slate-600" />
      <span className="text-slate-500 text-xs">No live feed connected</span>
      <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] bg-black/50 px-2 py-0.5 rounded-full text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> OFFLINE
      </span>
    </div>
    <div className="p-2 text-xs text-slate-400 bg-base-card">{name}</div>
  </div>
);

const AdminCameras = () => {
  const [note] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Camera className="w-6 h-6 text-primary" /> Camera Monitoring</h1>
        <p className="text-slate-400 text-sm mt-1">Live entry/exit camera feeds and vehicle image history.</p>
      </div>

      {note && (
        <div className="glass-card border-orange-500/30 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-slate-300">
            This is a UI-ready placeholder — no physical camera is wired in yet. Once an ESP32-CAM or
            IP camera is connected at the gate, its stream can be embedded here in place of these cards.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cams.map((c) => (
          <CameraFeed key={c.id} name={c.name} />
        ))}
      </div>

      <div className="glass-card">
        <h2 className="font-semibold mb-4">Vehicle Image History (demo)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-base-border">
                <th className="py-2 pr-4">Snapshot</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Vehicle No.</th>
                <th className="py-2 pr-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-base-border/50">
                  <td className="py-2 pr-4">
                    <div className="w-16 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-600 text-[10px]">
                      no image
                    </div>
                  </td>
                  <td className="py-2 pr-4">{h.type}</td>
                  <td className="py-2 pr-4 font-mono">{h.vehicle}</td>
                  <td className="py-2 pr-4 text-slate-400">{h.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCameras;
