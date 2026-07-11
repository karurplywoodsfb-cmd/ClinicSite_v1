// src/components/admin/CrossClinicRequestPanel.jsx
// Doctor/owner-facing. Requests a patient's history from OTHER clinics on
// the platform — gated by an OTP sent to the PATIENT, not the requester.

import { useState } from "react";
import { requestHealthShare, verifyHealthShare, getSharedPatientHistory } from "../../lib/supabase";

export default function CrossClinicRequestPanel({ clinicId }) {
  const [phone, setPhone]   = useState("");
  const [stage, setStage]   = useState("phone"); // phone | otp | granted
  const [requestId, setRequestId] = useState(null);
  const [otp, setOtp]       = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleRequest = async () => {
    if (!phone.trim()) return;
    setLoading(true); setError("");
    try {
      const { requestId } = await requestHealthShare(clinicId, phone.trim());
      setRequestId(requestId);
      setStage("otp");
    } catch (e) {
      setError(e.message || "Could not send request.");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true); setError("");
    try {
      await verifyHealthShare(requestId, otp);
      const h = await getSharedPatientHistory(phone.trim(), clinicId);
      setHistory(h);
      setStage("granted");
    } catch (e) {
      setError(e.message || "Incorrect code.");
    }
    setLoading(false);
  };

  const reset = () => { setPhone(""); setStage("phone"); setRequestId(null); setOtp(""); setHistory([]); setError(""); };

  const inputStyle = { width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#080c14", color: "#e2e8f0", padding: 10, fontSize: 14 };

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Request History from Other Clinics</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        Sends a one-time code to the patient's own WhatsApp. Nothing is shared until they give you that code.
      </p>

      {stage === "phone" && (
        <>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Patient phone number" style={{ ...inputStyle, marginBottom: 10 }} />
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button onClick={handleRequest} disabled={loading} style={{ background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {loading ? "Sending…" : "Send request code"}
          </button>
        </>
      )}

      {stage === "otp" && (
        <>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>Ask the patient for the 6-digit code sent to their WhatsApp:</p>
          <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="6-digit code" maxLength={6} style={{ ...inputStyle, marginBottom: 10 }} />
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleVerify} disabled={loading} style={{ background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Verifying…" : "Verify & unlock"}
            </button>
            <button onClick={reset} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </>
      )}

      {stage === "granted" && (
        <>
          <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 12 }}>✓ Access granted for 24 hours</div>
          {history.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>No records found elsewhere for this number.</div>}
          {history.map(h => (
            <div key={h.id} style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>{h.clinics?.name}</div>
              {(h.prescriptions || []).map(rx => (
                <div key={rx.id} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  {new Date(rx.created_at).toLocaleDateString("en-IN")} — {rx.diagnosis || "No diagnosis noted"}
                </div>
              ))}
            </div>
          ))}
          <button onClick={reset} style={{ background: "none", border: "none", color: "#7dd3fc", fontSize: 13, cursor: "pointer", marginTop: 8 }}>Request another patient</button>
        </>
      )}
    </div>
  );
}
