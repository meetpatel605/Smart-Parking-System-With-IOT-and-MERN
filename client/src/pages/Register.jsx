import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const COUNTRY_CODES = [
  "+1", "+7", "+20", "+27", "+30", "+31", "+32", "+33", "+34", "+36", "+39", "+40", "+41", "+43", "+44",
  "+45", "+46", "+47", "+48", "+49", "+51", "+52", "+53", "+54", "+55", "+56", "+57", "+58", "+60", "+61",
  "+62", "+63", "+64", "+65", "+66", "+81", "+82", "+84", "+86", "+90", "+91", "+92", "+93", "+94", "+95",
  "+98", "+212", "+213", "+216", "+220", "+221", "+222", "+223", "+224", "+225", "+226", "+227", "+228",
  "+229", "+230", "+231", "+232", "+233", "+234", "+235", "+236", "+237", "+238", "+239", "+240", "+241",
  "+242", "+243", "+244", "+245", "+246", "+248", "+249", "+250", "+251", "+252", "+253", "+254", "+255",
  "+256", "+257", "+258", "+260", "+261", "+262", "+263", "+264", "+265", "+266", "+267", "+268", "+269",
  "+290", "+291", "+297", "+298", "+299", "+350", "+351", "+352", "+353", "+354", "+355", "+356", "+357",
  "+358", "+359", "+370", "+371", "+372", "+373", "+374", "+375", "+376", "+377", "+378", "+380", "+381",
  "+382", "+383", "+385", "+386", "+387", "+389", "+420", "+421", "+423", "+500", "+501", "+502", "+503",
  "+504", "+505", "+506", "+507", "+508", "+509", "+590", "+591", "+592", "+593", "+594", "+595", "+596",
  "+597", "+598", "+599", "+670", "+672", "+673", "+674", "+675", "+676", "+677", "+678", "+679", "+680",
  "+681", "+682", "+683", "+684", "+685", "+686", "+687", "+688", "+689", "+690", "+691", "+692", "+850",
  "+852", "+853", "+855", "+856", "+880", "+886", "+960", "+961", "+962", "+963", "+964", "+965", "+966",
  "+967", "+968", "+970", "+971", "+972", "+973", "+974", "+975", "+976", "+977", "+992", "+993", "+994",
  "+995", "+996", "+998",
];

const Register = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "+91",
    mobile: "",
    password: "",
    confirmPassword: "",
    vehicleNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, mobile: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.token, data.user);
      if (data.qrDataUrl) {
        // SMTP not configured on server, show QR so user can save/print
        window.alert("Your parking QR has been generated. You can save it from the next page or check your email if configured.");
        // optionally open in new tab
        try { const w = window.open(); w.document.write(`<img src='${data.qrDataUrl}'/>`); } catch(e) {}
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded">{error}</div>}

        <div>
          <label className="label">Full Name</label>
          <input className="input" required value={form.fullName} onChange={set("fullName")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="label">Mobile Number</label>
            <input
              type="tel"
              className="input"
              required
              placeholder="1234567890"
              maxLength="10"
              value={form.mobile}
              onChange={handleMobileChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" required value={form.password} onChange={set("password")} />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className="input" required value={form.confirmPassword} onChange={set("confirmPassword")} />
          </div>
        </div>
        <div>
          <label className="label">Vehicle Number</label>
          <input className="input" placeholder="GJ01AB1234" value={form.vehicleNumber} onChange={set("vehicleNumber")} />
        </div>

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
        <p className="text-sm text-slate-400 text-center">
          Already have an account? <Link to="/login" className="text-primary">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
