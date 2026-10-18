import React from "react";

const colorMap = {
  primary: "text-primary bg-primary/10",
  secondary: "text-secondary bg-secondary/10",
  orange: "text-orange-400 bg-orange-400/10",
  danger: "text-danger bg-danger/10",
  purple: "text-purple-400 bg-purple-400/10",
};

const StatCard = ({ icon: Icon, label, value, color = "primary", sub }) => (
  <div className="card flex items-center gap-4">
    {Icon && (
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
    )}
    <div className="min-w-0">
      <div className="text-2xl font-extrabold leading-tight">{value}</div>
      <div className="text-slate-400 text-xs mt-0.5 truncate">{label}</div>
      {sub && <div className="text-slate-500 text-[11px] mt-0.5">{sub}</div>}
    </div>
  </div>
);

export default StatCard;
