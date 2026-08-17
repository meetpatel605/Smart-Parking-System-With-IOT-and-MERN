import React from "react";

const statusColors = {
  available: "bg-emerald-500/20 border-emerald-500 text-emerald-400",
  occupied: "bg-red-500/20 border-red-500 text-red-400",
  reserved: "bg-orange-500/20 border-orange-500 text-orange-400",
  maintenance: "bg-slate-500/20 border-slate-500 text-slate-400",
};

const statusDot = {
  available: "bg-emerald-500",
  occupied: "bg-red-500",
  reserved: "bg-orange-500",
  maintenance: "bg-slate-500",
};

const ParkingSlotCard = ({ slot, onClick, selected }) => {
  return (
    <button
      onClick={() => onClick && onClick(slot)}
      className={`border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${
        statusColors[slot.status] || statusColors.available
      } ${selected ? "ring-2 ring-primary" : ""} ${slot.status === "available" ? "hover:scale-105 cursor-pointer" : "cursor-default opacity-80"}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${statusDot[slot.status]}`} />
      <span className="font-bold text-sm">{slot.slotNumber}</span>
      <span className="text-[10px] uppercase tracking-wide">{slot.status}</span>
      {slot.category === "disabled" && <span className="text-[10px]">♿</span>}
      {slot.category === "ev" && <span className="text-[10px]">⚡</span>}
    </button>
  );
};

export default ParkingSlotCard;
