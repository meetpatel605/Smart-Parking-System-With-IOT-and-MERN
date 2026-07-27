import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ParkingSquare, CalendarCheck, Nfc, Camera,
  DoorOpen, Radio, BarChart3, FileText, Bell, Settings, ShieldCheck,
  LogOut, Menu, X, ChevronLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/slots", label: "Parking Slots", icon: ParkingSquare },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/rfid", label: "RFID Management", icon: Nfc },
  { to: "/admin/cameras", label: "Camera Monitoring", icon: Camera },
  { to: "/admin/gates", label: "Gate Management", icon: DoorOpen },
  { to: "/admin/sensors", label: "Sensor Monitoring", icon: Radio },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
  { to: "/admin/security", label: "Security", icon: ShieldCheck },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-base flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 flex flex-col bg-[#0b1424]/95 backdrop-blur-xl border-r border-base-border transition-all duration-300
        ${collapsed ? "lg:w-[76px]" : "lg:w-64"}
        ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 w-64"}`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-base-border shrink-0">
          {!collapsed && (
            <span className="font-bold text-primary flex items-center gap-2 whitespace-nowrap overflow-hidden">
              🚗 <span>Smart Parking</span>
            </span>
          )}
          <button
            className="hidden lg:flex text-slate-400 hover:text-white p-1"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button className="lg:hidden text-slate-400" onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative
                ${isActive ? "bg-primary/15 text-primary" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-base-border shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 sticky top-0 z-30 bg-base/80 backdrop-blur-xl border-b border-base-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-300" onClick={() => setMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-slate-200">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user?.fullName}</p>
              <p className="text-xs text-slate-500 leading-tight">Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {user?.fullName?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
