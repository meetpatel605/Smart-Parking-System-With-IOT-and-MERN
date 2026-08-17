import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const AdminReports = () => {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/admin/bookings"), api.get("/admin/users")]).then(([b, u]) => {
      setBookings(b.data.bookings);
      setUsers(u.data.users);
      setLoading(false);
    });
  }, []);

  const bookingRows = bookings.map((b) => [
    b.bookingCode,
    b.user?.fullName || "-",
    b.slot?.slotNumber || "-",
    b.date,
    `${b.startTime}-${b.endTime}`,
    b.vehicleNumber,
    b.status,
  ]);
  const bookingHeaders = ["Code", "User", "Slot", "Date", "Time", "Vehicle", "Status"];

  const usageRows = users.map((u) => [
    u.fullName,
    u.email,
    u.userType,
    u.vehicleNumber || "-",
    bookings.filter((b) => b.user?._id === u._id).length,
  ]);
  const usageHeaders = ["Name", "Email", "Type", "Vehicle", "Total Bookings"];

  const exportPdf = (title, headers, rows, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });
    doc.save(filename);
  };

  const exportExcel = (title, headers, rows, filename) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 30));
    XLSX.writeFile(wb, filename);
  };

  const reportCards = [
    {
      title: "Booking Report",
      desc: "Every booking made in the system with status and timing.",
      headers: bookingHeaders,
      rows: bookingRows,
      base: "booking-report",
    },
    {
      title: "Parking Usage / Vehicle Report",
      desc: "Per-user vehicle and booking-count summary.",
      headers: usageHeaders,
      rows: usageRows,
      base: "usage-report",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Generate and export booking and usage reports.</p>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading report data...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {reportCards.map((r) => (
            <div key={r.title} className="glass-card">
              <h2 className="font-semibold mb-1">{r.title}</h2>
              <p className="text-slate-400 text-sm mb-4">{r.desc} ({r.rows.length} rows)</p>
              <div className="flex gap-3">
                <button
                  onClick={() => exportPdf(r.title, r.headers, r.rows, `${r.base}.pdf`)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
                <button
                  onClick={() => exportExcel(r.title, r.headers, r.rows, `${r.base}.xlsx`)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card">
        <h2 className="font-semibold mb-4">Recent Bookings Preview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-base-border">
                {bookingHeaders.map((h) => <th key={h} className="py-2 pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {bookingRows.slice(0, 8).map((row, i) => (
                <tr key={i} className="border-b border-base-border/50">
                  {row.map((cell, j) => <td key={j} className="py-2 pr-4">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {bookingRows.length === 0 && <p className="text-slate-500 mt-4">No bookings yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
