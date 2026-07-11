// src/components/admin/PrescriptionPad.jsx
// Doctor-facing. This is a documentation/formatting tool, not a clinical
// decision engine — drug_master is a NAME autocomplete only. Every dosage
// instruction is free text the doctor types themselves; nothing here
// suggests or pre-fills a dose.

import { useState, useEffect, useRef } from "react";
import {
  findOrCreatePatient, searchPatients, searchDrugMaster, addCustomDrug,
  createPrescription, sendPrescription, getPatientHistory, getDoctors,
} from "../../lib/supabase";

function emptyItem() { return { drugName: "", strength: "", dosageInstructions: "", quantity: "" }; }

export default function PrescriptionPad({ clinicId, doctorId, lockedToDoctor = false }) {
  const [doctors, setDoctors]             = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || "");
  const [patientQuery, setPatientQuery]   = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patient, setPatient]             = useState(null);
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newName, setNewName]             = useState("");
  const [newPhone, setNewPhone]           = useState("");

  const [diagnosis, setDiagnosis]         = useState("");
  const [notes, setNotes]                 = useState("");
  const [items, setItems]                 = useState([emptyItem()]);
  const [drugSuggestions, setDrugSuggestions] = useState({}); // { itemIndex: [drugs] }
  const [history, setHistory]             = useState([]);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");
  const [savedRx, setSavedRx]             = useState(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (lockedToDoctor) return; // doctor-role users don't need a selector
    (async () => {
      try {
        const d = await getDoctors(clinicId);
        setDoctors(d);
        if (!selectedDoctorId && d.length === 1) setSelectedDoctorId(d[0].id);
      } catch (e) { console.error(e); }
    })();
  }, [clinicId, lockedToDoctor]);

  useEffect(() => {
    if (patientQuery.length < 2 || patient) { setPatientResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try { setPatientResults(await searchPatients(clinicId, patientQuery)); }
      catch (e) { console.error(e); }
    }, 300);
  }, [patientQuery, clinicId, patient]);

  const selectPatient = async (p) => {
    setPatient(p);
    setPatientResults([]);
    try { setHistory(await getPatientHistory(p.id)); }
    catch (e) { console.error(e); }
  };

  const createNewPatient = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    try {
      const p = await findOrCreatePatient(clinicId, { name: newName.trim(), phone: newPhone.trim() });
      await selectPatient(p);
      setNewPatientMode(false); setNewName(""); setNewPhone("");
    } catch (e) {
      alert(e.message || "Could not create patient.");
    }
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const handleDrugNameChange = async (idx, value) => {
    updateItem(idx, "drugName", value);
    if (value.length < 2) { setDrugSuggestions(s => ({ ...s, [idx]: [] })); return; }
    try {
      const results = await searchDrugMaster(clinicId, value);
      setDrugSuggestions(s => ({ ...s, [idx]: results }));
    } catch (e) { console.error(e); }
  };

  const pickSuggestion = (idx, drug) => {
    updateItem(idx, "drugName", drug.name);
    setDrugSuggestions(s => ({ ...s, [idx]: [] }));
  };

  const addCustomDrugName = async (idx, name) => {
    try {
      await addCustomDrug(clinicId, { name });
      updateItem(idx, "drugName", name);
      setDrugSuggestions(s => ({ ...s, [idx]: [] }));
    } catch (e) { console.error(e); }
  };

  const addItemRow = () => setItems(prev => [...prev, emptyItem()]);
  const removeItemRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setPatient(null); setPatientQuery(""); setDiagnosis(""); setNotes("");
    setItems([emptyItem()]); setHistory([]); setSavedRx(null); setError("");
  };

  const handleSave = async (andSend) => {
    if (!patient) { setError("Select or add a patient first."); return; }
    if (!selectedDoctorId) { setError("Select which doctor this prescription is from."); return; }
    const validItems = items.filter(it => it.drugName.trim() && it.dosageInstructions.trim());
    if (validItems.length === 0) { setError("Add at least one drug with dosage instructions."); return; }

    setSaving(true); setError("");
    try {
      const rx = await createPrescription(clinicId, {
        doctorId: selectedDoctorId, patientId: patient.id, diagnosis, notes, items: validItems,
      });
      setSavedRx(rx);
      if (andSend) await sendPrescription(rx.id);
    } catch (e) {
      setError(e.message || "Could not save prescription.");
    }
    setSaving(false);
  };

  const inputStyle = { width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#080c14", color: "#e2e8f0", padding: 10, fontSize: 13 };

  if (savedRx) {
    return (
      <div style={{ maxWidth: 600, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <p style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Prescription saved</p>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
          {savedRx.sent_at ? "Sent to the patient's WhatsApp." : "Not sent yet."}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {!savedRx.sent_at && (
            <button onClick={async () => { await sendPrescription(savedRx.id); setSavedRx({ ...savedRx, sent_at: new Date().toISOString() }); }}
              style={{ background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Send via WhatsApp
            </button>
          )}
          <button onClick={resetForm}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", borderRadius: 8, padding: "10px 18px", fontSize: 13, cursor: "pointer" }}>
            New prescription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>New Prescription</h2>

      {!lockedToDoctor && doctors.length > 1 && (
        <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}>
          <option value="">Writing as which doctor?</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      )}

      {/* ── Patient lookup ── */}
      {!patient && !newPatientMode && (
        <div style={{ marginBottom: 20 }}>
          <input value={patientQuery} onChange={e => setPatientQuery(e.target.value)} placeholder="Search patient by name or phone…" style={inputStyle} />
          {patientResults.map(p => (
            <div key={p.id} onClick={() => selectPatient(p)}
              style={{ padding: 10, borderRadius: 8, background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", marginTop: 6, cursor: "pointer", fontSize: 13, color: "#e2e8f0" }}>
              {p.name} · {p.phone}
            </div>
          ))}
          <button onClick={() => setNewPatientMode(true)} style={{ marginTop: 10, background: "none", border: "none", color: "#7dd3fc", fontSize: 13, cursor: "pointer" }}>
            + New patient
          </button>
        </div>
      )}

      {newPatientMode && (
        <div style={{ marginBottom: 20, background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Patient name" style={{ ...inputStyle, marginBottom: 8 }} />
          <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone" style={{ ...inputStyle, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={createNewPatient} style={{ flex: 1, background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add patient</button>
            <button onClick={() => setNewPatientMode(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {patient && (
        <>
          <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{patient.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{patient.phone}{patient.allergies ? ` · ⚠️ Allergies: ${patient.allergies}` : ""}</div>
            </div>
            <button onClick={resetForm} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Change</button>
          </div>

          {history.length > 0 && (
            <details style={{ marginBottom: 16 }}>
              <summary style={{ fontSize: 13, color: "#7dd3fc", cursor: "pointer" }}>View past visits ({history.length})</summary>
              <div style={{ marginTop: 8 }}>
                {history.map(h => (
                  <div key={h.id} style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {new Date(h.created_at).toLocaleDateString("en-IN")} — {h.diagnosis || "No diagnosis noted"}
                    {h.doctors?.name ? ` (Dr. ${h.doctors.name})` : ""}
                  </div>
                ))}
              </div>
            </details>
          )}

          <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Diagnosis (optional)" style={{ ...inputStyle, marginBottom: 12 }} />

          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>Rx</div>
          {items.map((item, idx) => (
            <div key={idx} style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, marginBottom: 8, position: "relative" }}>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <input value={item.drugName} onChange={e => handleDrugNameChange(idx, e.target.value)} placeholder="Drug name" style={inputStyle} />
                {drugSuggestions[idx]?.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, zIndex: 10, maxHeight: 160, overflowY: "auto" }}>
                    {drugSuggestions[idx].map(d => (
                      <div key={d.id} onClick={() => pickSuggestion(idx, d)} style={{ padding: 8, fontSize: 12, color: "#e2e8f0", cursor: "pointer" }}>
                        {d.name}{d.common_form ? ` (${d.common_form})` : ""}
                      </div>
                    ))}
                    <div onClick={() => addCustomDrugName(idx, item.drugName)} style={{ padding: 8, fontSize: 12, color: "#7dd3fc", cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      + Add "{item.drugName}" as new
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={item.strength} onChange={e => updateItem(idx, "strength", e.target.value)} placeholder="Strength (e.g. 500mg)" style={{ ...inputStyle, flex: 1 }} />
                <input value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} placeholder="Qty" style={{ ...inputStyle, flex: 1 }} />
              </div>
              <textarea value={item.dosageInstructions} onChange={e => updateItem(idx, "dosageInstructions", e.target.value)}
                placeholder="Dosage instructions, e.g. 1-0-1 after food × 5 days" rows={2}
                style={{ ...inputStyle, resize: "vertical" }} />
              {items.length > 1 && (
                <button onClick={() => removeItemRow(idx)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "#f87171", fontSize: 16, cursor: "pointer" }}>×</button>
              )}
            </div>
          ))}
          <button onClick={addItemRow} style={{ background: "none", border: "1px dashed rgba(255,255,255,0.15)", color: "#94a3b8", borderRadius: 8, padding: "8px 0", width: "100%", fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
            + Add another drug
          </button>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes (optional)" rows={2} style={{ ...inputStyle, marginBottom: 16, resize: "vertical" }} />

          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleSave(true)} disabled={saving}
              style={{ flex: 1, background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving…" : "Save & send via WhatsApp"}
            </button>
            <button onClick={() => handleSave(false)} disabled={saving}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", borderRadius: 8, padding: "12px 16px", fontSize: 14, cursor: "pointer" }}>
              Save only
            </button>
          </div>
        </>
      )}
    </div>
  );
}
