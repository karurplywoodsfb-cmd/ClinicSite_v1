// src/components/UpgradeModal.jsx
// Pricing modal shown when clinic owner clicks "Upgrade"

import { useState } from "react";
import { PLANS, openCheckout } from "../lib/razorpay";
import { updateClinic }        from "../lib/supabase";

export default function UpgradeModal({ clinic, user, onClose, onUpgraded }) {
  const [loading, setLoading] = useState(null); // plan id being processed
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleUpgrade = async (planKey) => {
    if (planKey === "free") return;
    setLoading(planKey);
    // TRIAL MODE — payments disabled
   alert(
    "💳 Payment integration is disabled for this internal trial.\n\n" +
    "To upgrade a clinic manually:\n" +
    "1. Go to Supabase → Table Editor → clinics\n" +
    "2. Find the clinic row\n" +
    "3. Change the 'plan' column to 'premium' or 'enterprise'\n\n" +
    "Razorpay will be enabled before public launch."
   );
   setLoading(null);
 };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'DM Sans', sans-serif",
    }} onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{
        background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 760,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 6 }}>Upgrade Plan</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Choose Your Plan</h2>
            <p style={{ fontSize: 13, color: "#475569", margin: "6px 0 0" }}>Current: <span style={{ color: "#22c55e", fontWeight: 600 }}>{PLANS[clinic.plan || "free"].name}</span></p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {error   && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>⚠️ {error}</div>}
        {success && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#22c55e", marginBottom: 16 }}>{success}</div>}

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {Object.values(PLANS).map((plan) => {
            const isCurrent  = (clinic.plan || "free") === plan.id;
            const isLoading  = loading === plan.id;

            return (
              <div key={plan.id} style={{
                background: plan.highlight ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isCurrent ? "rgba(34,197,94,0.4)" : plan.highlight ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14, padding: "22px 18px",
                position: "relative",
                boxShadow: plan.highlight ? "0 0 32px rgba(59,130,246,0.08)" : "none",
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#3b82f6", borderRadius: 20, padding: "3px 12px", fontSize: 10, color: "white", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>
                    MOST POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position: "absolute", top: -11, right: 16, background: "#22c55e", borderRadius: 20, padding: "3px 12px", fontSize: 10, color: "white", fontFamily: "monospace", fontWeight: 600 }}>
                    CURRENT
                  </div>
                )}

                <div style={{ fontSize: 12, color: plan.color, fontFamily: "monospace", fontWeight: 600, marginBottom: 6 }}>{plan.name.toUpperCase()}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: plan.color, marginBottom: 4, fontFamily: "monospace" }}>
                  {plan.price === 0 ? "Free" : `₹${plan.price}`}
                  {plan.price > 0 && <span style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>/mo</span>}
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "14px 0", paddingTop: 14 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, padding: "4px 0", fontSize: 12 }}>
                      <span style={{ color: plan.color, flexShrink: 0 }}>✓</span>
                      <span style={{ color: "#94a3b8" }}>{f}</span>
                    </div>
                  ))}
                  {plan.limits.map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, padding: "4px 0", fontSize: 12 }}>
                      <span style={{ color: "#334155", flexShrink: 0 }}>—</span>
                      <span style={{ color: "#334155" }}>{l}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !isCurrent && handleUpgrade(plan.id)}
                  disabled={isCurrent || isLoading}
                  style={{
                    width: "100%", padding: "10px",
                    background: isCurrent
                      ? "rgba(34,197,94,0.1)"
                      : plan.highlight
                      ? "#3b82f6"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isCurrent ? "rgba(34,197,94,0.3)" : plan.highlight ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                    color: isCurrent ? "#22c55e" : "white",
                    borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: isCurrent ? "default" : "pointer",
                    fontFamily: "inherit", transition: "all .2s",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? "Processing..." : isCurrent ? "✓ Active" : plan.price === 0 ? "Downgrade" : `Upgrade → ₹${plan.price}/mo`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust signals */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          {["🔒 Secure payment via Razorpay", "✓ Cancel anytime", "✓ No hidden charges", "✓ UPI / Cards / NetBanking"].map((t, i) => (
            <span key={i} style={{ fontSize: 12, color: "#334155" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
