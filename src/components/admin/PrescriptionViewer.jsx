// src/components/admin/PrescriptionViewer.jsx
// Read-only. Nurse + owner land here instead of PrescriptionPad — they can
// look up any prescription in the clinic and print it, but never create or
// edit one (that's exclusive to role="doctor", enforced by RLS + PermissionGate).
//
// This also doubles as the fix for "unable to fetch entered prescription":
// PrescriptionPad only ever showed history for a patient already selected
// mid-session. This gives everyone a real searchable list + single-record
// fetch (via getPrescription), independent of that session state.

import { useState, useEffect } from "react";
import { listPrescriptions, getPrescription } from "../../lib/supabase";

export default function PrescriptionViewer({ clinicId }) {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (q = "") => {
    setLoading(true); setError("");
    try {
      setList(await listPrescriptions(clinicId, { search: q }));
    } catch (e) {
      setError(e.message || "Could not load prescriptions.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [clinicId]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await getPrescription(id));
    } catch (e) {
      setError(e.message || "Could not fetch that prescription.");
    }
    setDetailLoading(false);
  };

  const inputStyle = { width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#080c14", color: "#e2e8f0", padding: 10, fontSize: 13 };

  // ── Detail / print view ──────────────────────────────────────────
  if (selectedId) {
    return (
      <div style={{ maxWidth: 640 }}>
        <button onClick={() => { setSelectedId(null); setDetail(null); }}
          className="no-print"
          style={{ background: "none", border: "none", color: "#7dd3fc", fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
          ← Back to list
        </button>

        {detailLoading && <p style={{ color: "#64748b", fontSize: 13 }}>Loading…</p>}
        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</div>}

        {detail && (
          <>
            <div id="rx-print-area" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Dr. {detail.doctors?.name || "—"}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {detail.doctors?.degree}{detail.doctors?.reg_number ? ` · Reg. ${detail.doctors.reg_number}` : ""}
                    {detail.doctors?.council_name ? ` (${detail.doctors.council_name})` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
                  {new Date(detail.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{detail.patients?.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {detail.patients?.phone}
                  {detail.patients?.dob ? ` · DOB ${new Date(detail.patients.dob).toLocaleDateString("en-IN")}` : ""}
                  {detail.patients?.allergies ? ` · ⚠️ Allergies: ${detail.patients.allergies}` : ""}
                </div>
              </div>

              {detail.diagnosis && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 2 }}>Diagnosis</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0" }}>{detail.diagnosis}</div>
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>Rx</div>
              {(detail.prescription_items || []).sort((a, b) => a.sort_order - b.sort_order).map(it => (
                <div key={it.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                    {it.drug_name}{it.strength ? ` — ${it.strength}` : ""}{it.quantity ? ` × ${it.quantity}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{it.dosage_instructions}</div>
                </div>
              ))}

              {detail.notes && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 2 }}>Notes</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0" }}>{detail.notes}</div>
                </div>
              )}
            </div>

            <button onClick={() => window.print()} className="no-print"
              style={{ background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              🖨️ Print
            </button>

            {/* Print-only styling: hide everything except the prescription card */}
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #rx-print-area, #rx-print-area * { visibility: visible; }
                #rx-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; background: white !important; color: black !important; }
                #rx-print-area * { color: black !important; border-color: #ccc !important; }
                .no-print { display: none !important; }
              }
            `}</style>
          </>
        )}
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>Prescriptions</h2>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient name or phone…" style={{ ...inputStyle, marginBottom: 16 }} />

      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</div>}
      {loading && <p style={{ color: "#64748b", fontSize: 13 }}>Loading…</p>}
      {!loading && list.length === 0 && <p style={{ color: "#64748b", fontSize: 13 }}>No prescriptions found.</p>}

      {list.map(rx => (
        <div key={rx.id} onClick={() => openDetail(rx.id)}
          style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14, marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{rx.patients?.name || "Unknown patient"}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Dr. {rx.doctors?.name || "—"} · {new Date(rx.created_at).toLocaleDateString("en-IN")}
              {rx.diagnosis ? ` · ${rx.diagnosis}` : ""}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#7dd3fc" }}>View →</div>
        </div>
      ))}
    </div>
  );
}
