import React from "react";

const About = () => (
  <div className="max-w-3xl mx-auto px-4 py-14">
    <h1 className="text-3xl font-bold mb-6">About the Project</h1>

    <div className="card mb-6">
      <h2 className="font-semibold text-lg mb-2 text-primary">Project</h2>
      <p className="text-slate-400 text-sm">
        Smart Parking Management System is an IoT-enabled campus parking solution that combines
        time-based slot booking, live occupancy tracking, and RFID-based gate access to remove the
        guesswork from finding parking.
      </p>
    </div>

    <div className="card mb-6">
      <h2 className="font-semibold text-lg mb-2 text-primary">Technology</h2>
      <p className="text-slate-400 text-sm">MERN Stack — MongoDB, Express, React, Node.js — with JWT authentication and a role-based dashboard for students, faculty, and admins.</p>
    </div>

    <div className="card">
      <h2 className="font-semibold text-lg mb-2 text-primary">Hardware</h2>
      <p className="text-slate-400 text-sm">ESP32 microcontroller, RFID reader, IR sensors, and a servo-controlled gate — connected to the backend API for real-time entry verification.</p>
    </div>
  </div>
);

export default About;
