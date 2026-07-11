// src/components/admin/BillingForm.jsx
// Receptionist/accountant/owner-facing. Itemized OPD invoice builder.

import { useState, useEffect } from "react";
import { searchPatients, createInvoice, markInvoicePaid, sendInvoice, getInvoices } from "../../lib/supabase";

const CATEGORIES = [
  { value: "consultation", label: "Consultation" },
  { value: "procedure",    label: "Procedure" },
  { value: "xray",         label: "X-ray" },
  { value: "other",        label: "Other" },
];
const PAYMENT_MODES = ["upi", "cash", "card", "insurance"];

function emptyLine() { return { description: "", category: "consultation", amount: "" }; }

export default function BillingForm({ clinicId }) {
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patient, setPatient] = useState(null);
  const [lines, setLines] = useState([emptyLine()]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [markPaidNow, setMarkPaidNow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [recent, setRecent] = useState([]);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    if (patientQuery.length < 2 || patient) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try { setPatientResults(await searchPatients(clinicId, patientQuery)); } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery, clinicId, patient]);

  const updateLine = (idx, field, value) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const subtotal = lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const tax = Math.round((subtotal - Number(discount || 0)) * (Number(taxPercent || 0) / 100) * 100) / 100;
  const total = Math.round((subtotal - Number(discount || 0) + tax) * 100) / 100;

  const loadRecent = async () => {
    try { setRecent(await getInvoices(clinicId)); setShowRecent(true); } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setPatient(null); setPatientQuery(""); setLines([emptyLine()]);
    setDiscount(0); setTaxPercent(0); setPaymentMode("cash"); setSavedInvoice(null); setError("");
  };

  const handleSave = async () => {
    const validLines = lines.filter(l => l.description.trim() && Number(l.amount) > 0);
    if (validLines.length === 0) { setError("Add at least one billed item with an amount."); return; }

    setSaving(true); setError("");
    try {
      const invoice = await createInvoice(clinicId, {
        patientId: patient?.id || null,
        items: validLines,
        discount: Number(discount || 0),
        taxPercent: Number(taxPercent || 0),
        paymentMode,
      });
      if (markPaidNow) await markInvoicePaid(invoice.id, paymentMode);
      if (patient?.phone) await sendInvoice(invoice.id);
      setSavedInvoice({ ...invoice, payment_status: markPaidNow ? "paid" : "unpaid" });
    } catch (e) {
      setError(e.message || "Could not create invoice.");
    }
    setSaving(false);
  };

  const inputStyle = { width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#080c14", color: "#e2e8f0", padding: 10, fontSize: 13 };

  if (savedInvoice) {
    return (
      <div style={{ maxWidth: 480, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
        <p style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Invoice #{savedInvoice.invoice_number} created</p>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>Total: ₹{savedInvoice.total}</p>
        <p style={{ color: savedInvoice.payment_status === "paid" ? "#4ade80" : "#f59e0b", fontSize: 13, marginBottom: 20 }}>
          {savedInvoice.payment_status === "paid" ? "Marked as paid" : "Unpaid"}
        </p>
        <button onClick={resetForm} style={{ background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          New invoice
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>New Invoice</h2>
        <button onClick={loadRecent} style={{ background: "none", border: "none", color: "#7dd3fc", fontSize: 13, cursor: "pointer" }}>View recent invoices</button>
      </div>

      {showRecent && (
        <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 12, marginBottom: 16, maxHeight: 240, overflowY: "auto" }}>
          {recent.length === 0 && <div style={{ color: "#64748b", fontSize: 12 }}>No invoices yet.</div>}
          {recent.map(inv => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span>#{inv.invoice_number} · {inv.patients?.name || "Walk-in"}</span>
              <span style={{ color: inv.payment_status === "paid" ? "#4ade80" : "#f59e0b" }}>₹{inv.total} · {inv.payment_status}</span>
            </div>
          ))}
          <button onClick={() => setShowRecent(false)} style={{ marginTop: 8, background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>Close</button>
        </div>
      )}

      {/* ── Patient (optional — walk-ins can bill without a saved patient) ── */}
      {!patient ? (
        <div style={{ marginBottom: 16 }}>
          <input value={patientQuery} onChange={e => setPatientQuery(e.target.value)} placeholder="Search patient (optional — leave blank for walk-in)" style={inputStyle} />
          {patientResults.map(p => (
            <div key={p.id} onClick={() => { setPatient(p); setPatientResults([]); }}
              style={{ padding: 10, borderRadius: 8, background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", marginTop: 6, cursor: "pointer", fontSize: 13, color: "#e2e8f0" }}>
              {p.name} · {p.phone}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: "#e2e8f0" }}>{patient.name} · {patient.phone}</div>
          <button onClick={() => setPatient(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Change</button>
        </div>
      )}

      {/* ── Line items ── */}
      {lines.map((line, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <select value={line.category} onChange={e => updateLine(idx, "category", e.target.value)} style={{ ...inputStyle, flex: "0 0 130px" }}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input value={line.description} onChange={e => updateLine(idx, "description", e.target.value)} placeholder="Description" style={{ ...inputStyle, flex: 1 }} />
          <input value={line.amount} onChange={e => updateLine(idx, "amount", e.target.value)} placeholder="₹" type="number" style={{ ...inputStyle, flex: "0 0 90px" }} />
          {lines.length > 1 && <button onClick={() => removeLine(idx)} style={{ background: "none", border: "none", color: "#f87171", fontSize: 18, cursor: "pointer" }}>×</button>}
        </div>
      ))}
      <button onClick={addLine} style={{ background: "none", border: "1px dashed rgba(255,255,255,0.15)", color: "#94a3b8", borderRadius: 8, padding: "8px 0", width: "100%", fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
        + Add line item
      </button>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Discount (₹)</div>
          <input value={discount} onChange={e => setDiscount(e.target.value)} type="number" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Tax (%)</div>
          <input value={taxPercent} onChange={e => setTaxPercent(e.target.value)} type="number" style={inputStyle} />
        </div>
      </div>

      <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8", marginBottom: 4 }}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        {Number(discount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8", marginBottom: 4 }}><span>Discount</span><span>-₹{Number(discount).toFixed(2)}</span></div>}
        {tax > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8", marginBottom: 4 }}><span>Tax</span><span>₹{tax.toFixed(2)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Payment mode</div>
        <div style={{ display: "flex", gap: 8 }}>
          {PAYMENT_MODES.map(m => (
            <button key={m} onClick={() => setPaymentMode(m)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                border: paymentMode === m ? "1.5px solid #1565c0" : "1px solid rgba(255,255,255,0.1)",
                background: paymentMode === m ? "rgba(21,101,192,0.1)" : "transparent", color: paymentMode === m ? "#7dd3fc" : "#94a3b8" }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8", marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={markPaidNow} onChange={e => setMarkPaidNow(e.target.checked)} />
        Mark as paid now
      </label>

      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <button onClick={handleSave} disabled={saving}
        style={{ width: "100%", background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        {saving ? "Creating…" : patient ? "Create invoice & send via WhatsApp" : "Create invoice"}
      </button>
    </div>
  );
}
