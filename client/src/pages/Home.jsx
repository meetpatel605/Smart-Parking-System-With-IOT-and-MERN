import React from "react";
import { Link } from "react-router-dom";

const features = [
  { icon: "📡", title: "RFID Entry", desc: "Seamless gate access using RFID-linked bookings." },
  { icon: "⏱️", title: "Time-Based Booking", desc: "Reserve a slot for the exact time window you need." },
  { icon: "🟢", title: "Live Parking View", desc: "See real-time slot availability before you arrive." },
  { icon: "🔔", title: "Smart Notifications", desc: "Reminders, confirmations, and alerts, instantly." },
  { icon: "📊", title: "Analytics", desc: "Admins get peak-hour and occupancy insights." },
  { icon: "🧾", title: "Waiting List", desc: "Join the queue when a slot is full and get notified." },
];

const steps = [
  { step: "1", title: "Register", desc: "Create your account with vehicle details." },
  { step: "2", title: "Book a Slot", desc: "Pick date, time, and an available slot." },
  { step: "3", title: "Scan & Park", desc: "Tap your RFID card at the gate to enter." },
];

const Home = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-900/30 to-base px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          🚗 Smart <span className="text-primary">Parking</span> Management System
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto mb-8">
          IoT + RFID powered campus parking — book a slot in seconds, park without the hassle.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/register" className="btn-primary">Book Parking</Link>
          <Link to="/login" className="btn-secondary">Login</Link>
        </div>
      </section>

      {/* Live Parking Preview */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold mb-6 text-center">Live Parking Preview</h2>
        <div className="card">
          <div className="flex justify-between text-sm text-slate-400 mb-4">
            <span>Entry Gate</span>
            <span>Exit Gate</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {["available","occupied","available","reserved","available","available","occupied","available","available","maintenance","available","reserved"].map((s, i) => (
              <div key={i} className={`rounded-lg p-3 text-center text-xs font-semibold border ${
                s === "available" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" :
                s === "occupied" ? "bg-red-500/20 border-red-500 text-red-400" :
                s === "reserved" ? "bg-orange-500/20 border-orange-500 text-orange-400" :
                "bg-slate-500/20 border-slate-500 text-slate-400"
              }`}>
                {String.fromCharCode(65 + Math.floor(i/6))}{(i%6)+1}
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-xs mt-4">Login to see real-time status of every slot.</p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-base-card/40 py-14 px-4">
        <h2 className="text-2xl font-bold mb-10 text-center">Features</h2>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold mb-10 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.step} className="card text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary flex items-center justify-center font-bold mb-3">
                {s.step}
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-slate-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section className="bg-primary/10 py-14 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["18", "Total Slots"],
            ["3", "Zones"],
            ["24/7", "RFID Access"],
            ["100%", "Digital Booking"],
          ].map(([num, label]) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-primary">{num}</div>
              <div className="text-slate-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
