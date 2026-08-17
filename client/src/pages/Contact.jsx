import React, { useState } from "react";

const Contact = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      {sent ? (
        <div className="card text-primary">Thanks for reaching out! We'll get back to you soon.</div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows="4" required />
          </div>
          <button className="btn-primary">Send Message</button>
        </form>
      )}

      <div className="card mt-6 text-sm text-slate-400 space-y-1">
        <p>📍 College Campus, Main Building</p>
        <p>✉️ support@smartparking.com</p>
        <p>📞 +91 98765 43210</p>
      </div>
    </div>
  );
};

export default Contact;
