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
    address: "",
    aadhaarNumber: "",
    password: "",
    confirmPassword: "",
    vehicleNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, mobile: value });
  };

  const handleVehicleNumberChange = (e) => {
    setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() });
  };

  const handleAadhaarChange = (e) => {
    setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) });
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
      if (data.requiresEmailVerification) {
        setVerificationMessage(data.demoOtp ? `${data.message}. Your OTP is ${data.demoOtp}.` : data.message);
        setVerificationStep(true);
        return;
      }
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

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", { email: form.email, otp: verificationOtp });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Email verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (verificationStep) {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <h1 className="text-3xl font-bold mb-6 text-center">Verify Email</h1>
        <form onSubmit={handleVerifyEmail} className="card space-y-4">
          {error && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded">{error}</div>}
          {verificationMessage && <div className="bg-primary/10 border border-primary text-primary text-sm p-2 rounded">{verificationMessage}</div>}
          <p className="text-sm text-slate-400">Enter the verification OTP sent to {form.email}.</p>
          <div>
            <label className="label">Verification OTP</label>
            <input className="input" required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={verificationOtp} onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <div className="bg-red-500/10 border border-danger text-danger text-sm p-2 rounded">{error}</div>}

        <div>
          <label className="label">Full Name</label>
          <input className="input" required placeholder="Enter your full name" value={form.fullName} onChange={set("fullName")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required placeholder="Enter your email" value={form.email} onChange={set("email")} />
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
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className="input pr-10" required placeholder="Enter password" value={form.password} onChange={set("password")} />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8-.4 1.2-1.1 2.5-2.1 3.6M6.6 6.6C4.7 7.8 3.4 9.8 2 12c1.3 4 5 8 10 8 1.5 0 2.8-.3 4-.9" /> : <><path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} className="input pr-10" required placeholder="Re-enter password" value={form.confirmPassword} onChange={set("confirmPassword")} />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-primary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showConfirmPassword ? <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8-.4 1.2-1.1 2.5-2.1 3.6M6.6 6.6C4.7 7.8 3.4 9.8 2 12c1.3 4 5 8 10 8 1.5 0 2.8-.3 4-.9" /> : <><path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <textarea className="input min-h-24 resize-y" required placeholder="Enter your address" value={form.address} onChange={set("address")} />
        </div>
        <div>
          <label className="label">Aadhaar Card Number</label>
          <input type="text" inputMode="numeric" className="input" required placeholder="Enter 12-digit Aadhaar number" maxLength="12" value={form.aadhaarNumber} onChange={handleAadhaarChange} />
        </div>
        <div>
          <label className="label">Vehicle Number</label>
          <input className="input" placeholder="Enter vehicle number (e.g. GJ01AB1234)" value={form.vehicleNumber} onChange={handleVehicleNumberChange} />
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
