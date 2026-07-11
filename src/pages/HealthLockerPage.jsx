// src/pages/HealthLockerPage.jsx
// Route: /myhealth — platform-wide, not clinic-specific.
// Patient logs in with their own phone (real Supabase phone auth via the
// send-sms-hook → MSG91), then sees every record across every clinic on
// the platform that matches their verified phone number.

import { useState, useEffect } from "react";
import { supabase, sendLockerOtp, verifyLockerOtp, getMyLockerRecords, getMyLockerSubscription, updateMyEmergencyProfile } from "../lib/supabase";

const FREE_DOC_LIMIT = 10;

export default function HealthLockerPage() {
  const [session, setSession]   = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) return <Centered>Loading…</Centered>;
  return session ? <LockerDashboard onLogout={() => supabase.auth.signOut()} /> : <LockerLogin />;
}

function Centered({ children }) {
  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#64748b" }}>{children}</div>;
}

function LockerLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp]     = useState("");
  const [stage, setStage] = useState("phone"); // phone | otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhone = () => phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, "").length < 10) { setError("Enter a valid phone number."); return; }
    setLoading(true); setError("");
    try { await sendLockerOtp(fullPhone()); setStage("otp"); }
    catch (e) { setError(e.message || "Could not send code."); }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true); setError("");
    try { await verifyLockerOtp(fullPhone(), otp); }
    catch (e) { setError(e.message || "Incorrect code."); }
    setLoading(false);
  };

  const inputStyle = { width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 14, fontSize: 16, fontFamily: "inherit", marginBottom: 12 };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 8px 32px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Health Locker</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
          {stage === "phone" ? "See your medical records from every clinic, in one place." : `Code sent to ${phone}`}
        </p>

        {stage === "phone" ? (
          <>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={inputStyle} />
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleSendOtp} disabled={loading} style={{ width: "100%", background: "#1565c0", color: "white", border: "none", borderRadius: 10, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </>
        ) : (
          <>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="6-digit code" style={inputStyle} maxLength={6} />
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleVerify} disabled={loading} style={{ width: "100%", background: "#1565c0", color: "white", border: "none", borderRadius: 10, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Verifying…" : "Verify"}
            </button>
            <button onClick={() => setStage("phone")} style={{ width: "100%", background: "none", border: "none", color: "#64748b", fontSize: 13, marginTop: 10, cursor: "pointer" }}>
              Change number
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LockerDashboard({ onLogout }) {
  const [records, setRecords] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("records"); // records | emergency

  useEffect(() => {
    (async () => {
      try {
        const [r, s] = await Promise.all([getMyLockerRecords(), getMyLockerSubscription()]);
        setRecords(r); setSubscription(s);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const allPrescriptions = records.flatMap(r => (r.prescriptions || []).map(p => ({ ...p, clinicName: r.clinics?.name })));
  const docCount = allPrescriptions.length;
  const isPremium = subscription?.tier === "premium";
  const overLimit = !isPremium && docCount > FREE_DOC_LIMIT;
  const visibleDocs = overLimit ? allPrescriptions.slice(0, FREE_DOC_LIMIT) : allPrescriptions;
  const primaryPatient = records[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#0f172a", color: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>🔐 Health Locker</div>
        <button onClick={onLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Log out</button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "16px 20px 0" }}>
        <button onClick={() => setTab("records")} style={tabStyle(tab === "records")}>My Records</button>
        <button onClick={() => setTab("emergency")} style={tabStyle(tab === "emergency")}>Emergency Profile</button>
      </div>

      <div style={{ padding: 20, maxWidth: 560, margin: "0 auto" }}>
        {loading && <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Loading…</div>}

        {!loading && tab === "records" && (
          <>
            {!isPremium && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: "#1e40af" }}>
                Free plan: showing {Math.min(docCount, FREE_DOC_LIMIT)} of {docCount} documents.
                {overLimit && " Upgrade for unlimited history, family profiles, and the emergency QR card."}
              </div>
            )}
            {visibleDocs.length === 0 && (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No records yet. They'll appear here after your next visit to a participating clinic.</div>
            )}
            {visibleDocs.map(doc => (
              <div key={doc.id} style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 10, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{doc.clinicName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(doc.created_at).toLocaleDateString("en-IN")}</div>
                </div>
                {doc.diagnosis && <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>{doc.diagnosis}</div>}
                {(doc.prescription_items || []).map(item => (
                  <div key={item.id} style={{ fontSize: 12, color: "#64748b" }}>
                    {item.drug_name}{item.strength ? ` ${item.strength}` : ""} — {item.dosage_instructions}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {!loading && tab === "emergency" && (
          <EmergencyProfileEditor patient={primaryPatient} isPremium={isPremium} />
        )}
      </div>
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: "10px 16px", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: active ? "#f8fafc" : "transparent", color: active ? "#0f172a" : "rgba(255,255,255,0.6)",
  };
}

function EmergencyProfileEditor({ patient, isPremium }) {
  const [bloodGroup, setBloodGroup] = useState(patient?.blood_group || "");
  const [allergies, setAllergies]   = useState(patient?.allergies || "");
  const [contactName, setContactName] = useState(patient?.emergency_contact_name || "");
  const [contactPhone, setContactPhone] = useState(patient?.emergency_contact_phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyEmergencyProfile({ bloodGroup, allergies, contactName, contactPhone });
      setSaved(true);
    } catch (e) { alert(e.message || "Could not save."); }
    setSaving(false);
  };

  const inputStyle = { width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 14, fontFamily: "inherit", marginBottom: 10 };
  const qrUrl = patient?.emergency_token ? `${window.location.origin}/emergency/${patient.emergency_token}` : null;

  return (
    <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        Shown to anyone who scans your emergency QR card — keep it limited to what a stranger would need in an emergency.
      </p>
      <input value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} placeholder="Blood group" style={inputStyle} />
      <textarea value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Known allergies" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Emergency contact name" style={inputStyle} />
      <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Emergency contact phone" style={inputStyle} />
      <button onClick={handleSave} disabled={saving} style={{ width: "100%", background: "#1565c0", color: "white", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>

      {isPremium && qrUrl ? (
        <div style={{ textAlign: "center", padding: 16, background: "#f8fafc", borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Your emergency profile link (print as a QR code):</div>
          <code style={{ fontSize: 11, color: "#1565c0", wordBreak: "break-all" }}>{qrUrl}</code>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Upgrade to Premium to get a printable emergency QR card.</div>
      )}
    </div>
  );
}
