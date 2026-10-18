import React, { useState } from "react";
import { DoorOpen, DoorClosed, AlertTriangle } from "lucide-react";

const initialGates = [
  { id: 1, name: "Main Gate — Entry", status: "closed", servo: "OK" },
  { id: 2, name: "Main Gate — Exit", status: "closed", servo: "OK" },
  { id: 3, name: "East Gate", status: "closed", servo: "OK" },
];

const AdminGates = () => {
  const [gates, setGates] = useState(initialGates);

  const toggle = (id, status) => {
    setGates((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><DoorOpen className="w-6 h-6 text-primary" /> Gate Management</h1>
        <p className="text-slate-400 text-sm mt-1">Manually control gates and monitor servo motor status.</p>
      </div>

      <div className="glass-card border-orange-500/30 flex items-start gap-3 text-sm">
        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-slate-300">
          Controls below update the on-screen state only — wire an ESP32 + servo to a
          <code className="mx-1 px-1.5 py-0.5 bg-black/30 rounded text-xs">/api/gates/:id/status</code>
          endpoint to make these physically operate a gate.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gates.map((g) => (
          <div key={g.id} className="glass-card text-center">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
              g.status === "open" ? "bg-primary/15 text-primary" : "bg-slate-500/15 text-slate-400"
            }`}>
              {g.status === "open" ? <DoorOpen className="w-8 h-8" /> : <DoorClosed className="w-8 h-8" />}
            </div>
            <h3 className="font-semibold">{g.name}</h3>
            <p className="text-xs text-slate-500 mb-1">Servo Motor: <span className="text-primary">{g.servo}</span></p>
            <p className={`text-sm font-semibold uppercase mb-4 ${g.status === "open" ? "text-primary" : "text-slate-400"}`}>
              {g.status}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => toggle(g.id, "open")} className="btn-primary text-sm" disabled={g.status === "open"}>
                Open Gate
              </button>
              <button onClick={() => toggle(g.id, "closed")} className="btn-secondary text-sm" disabled={g.status === "closed"}>
                Close Gate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGates;
