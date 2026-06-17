// src/components/DPDPConsentBlock.jsx
// DPDP Act 2023 — mandatory double-consent block
// Used in BookingEngine.jsx before form submission
// Both checkboxes MUST be unchecked by default (pre-checked = invalid)

import { useState } from "react";
import { usePlanEnforcement } from "../hooks/usePlanEnforcement";

export default function DPDPConsentBlock({ clinic, onChange }) {
  const [consentA, setConsentA] = useState(false); // appointment processing
  const [consentB, setConsentB] = useState(false); // communications
  const [expanded, setExpanded] = useState(false);

  const bothConsented = consentA && consentB;

  const handleA = (val) => { setConsentA(val); onChange?.(val, consentB); };
  const handleB = (val) => { setConsentB(val); onChange?.(consentA, val); };

  return (
    <div style={{
      background: bothConsented ? "rgba(34,197,94,0.04)" : "#fafcff",
      border: `1.5px solid ${bothConsented ? "#bbf7d0" : "#dce8f5"}`,
      borderRadius: 10, padding: "16px 18px",
      fontFamily: "'DM Sans', sans-serif",
      transition: "all .25s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
          🔒
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0b2545" }}>
            Data Processing Consent
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
            Required under the Digital Personal Data Protection Act, 2023
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 11, color: "#1565c0", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
          {expanded ? "Hide details" : "What is this?"}
        </button>
      </div>

      {/* Explainer */}
      {expanded && (
        <div style={{ background: "#f0f7ff", border: "1px solid #dce8f5", borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
          Under the <strong style={{ color: "#0b2545" }}>Digital Personal Data Protection Act, 2023</strong> (India), you have the right to know how your personal data is collected, used, and stored. {clinic?.name || "This clinic"} collects your name and phone number solely to manage your appointment. You may withdraw consent at any time by contacting the clinic. Your data is stored securely and not sold to third parties. Read our full{" "}
          <a href={`/${clinic?.slug}/privacy-policy`} target="_blank" rel="noopener noreferrer" style={{ color: "#1565c0" }}>
            Privacy Policy
          </a>.
        </div>
      )}

      {/* Consent A — Appointment processing */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 12, padding: "10px 12px", borderRadius: 8, background: consentA ? "rgba(34,197,94,0.05)" : "white", border: `1px solid ${consentA ? "#bbf7d0" : "#e2e8f0"}`, transition: "all .2s" }}>
        <input
          type="checkbox"
          checked={consentA}
          onChange={e => handleA(e.target.checked)}
          style={{ marginTop: 2, accentColor: "#1565c0", width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0b2545", marginBottom: 3 }}>
            Appointment Data Processing <span style={{ color: "#ef4444" }}>*</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            I consent to <strong>{clinic?.name || "this clinic"}</strong> collecting and processing my name, phone number, and consultation details for the sole purpose of scheduling and managing this appointment. I understand I may withdraw this consent at any time by contacting the clinic directly.
          </div>
        </div>
      </label>

      {/* Consent B — Communications */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 14, padding: "10px 12px", borderRadius: 8, background: consentB ? "rgba(34,197,94,0.05)" : "white", border: `1px solid ${consentB ? "#bbf7d0" : "#e2e8f0"}`, transition: "all .2s" }}>
        <input
          type="checkbox"
          checked={consentB}
          onChange={e => handleB(e.target.checked)}
          style={{ marginTop: 2, accentColor: "#1565c0", width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0b2545", marginBottom: 3 }}>
            Appointment Reminders <span style={{ color: "#ef4444" }}>*</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            I consent to receiving appointment confirmations and reminders via SMS and WhatsApp on the number I provide. Standard messaging rates may apply. I may opt out at any time by replying STOP.
          </div>
        </div>
      </label>

      {/* Privacy link */}
      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
        By proceeding, you acknowledge our{" "}
        <a href={`/${clinic?.slug}/privacy-policy`} target="_blank" rel="noopener noreferrer" style={{ color: "#1565c0" }}>
          Privacy Policy
        </a>{" "}and your rights under the DPDP Act, 2023 — including the right to access, correct, and request erasure of your data.
      </div>

      {/* Status */}
      {!bothConsented && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#f59e0b" }}>
          <span>⚠</span> Both consents are required to proceed with booking.
        </div>
      )}
      {bothConsented && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#22c55e" }}>
          <span>✓</span> Consent recorded. You may now confirm your appointment.
        </div>
      )}
    </div>
  );
}