// src/components/admin/StaffManagement.jsx
// Owner-only. Invite staff, assign role, link doctor-role staff to a
// doctor record (for multi-doctor calendar routing).

import { useState, useEffect } from "react";
import { getClinicStaff, inviteStaffMember, updateStaffMember, removeStaffMember, getDoctors } from "../../lib/supabase";
import { ROLE_LABELS } from "../../config/permissions";

const ROLE_OPTIONS = [
  { value: "doctor",       label: "Doctor",       hint: "Sees only their own patients & calendar; only role that can write/edit prescriptions" },
  { value: "nurse",        label: "Nurse",        hint: "Can view & print prescriptions the doctor wrote; cannot create or edit" },
  { value: "receptionist", label: "Receptionist", hint: "Manages calendar & queue, no financials" },
  { value: "accountant",   label: "Accountant",    hint: "Billing & financial reports only" },
];

export default function StaffManagement({ clinicId }) {
  const [staff, setStaff]     = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail]     = useState("");
  const [name, setName]       = useState("");
  const [role, setRole]       = useState("receptionist");
  const [doctorId, setDoctorId] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([getClinicStaff(clinicId), getDoctors(clinicId)]);
      setStaff(s);
      setDoctors(d);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [clinicId]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSaving(true);
    setError("");
    try {
      await inviteStaffMember(clinicId, {
        email: email.trim(),
        name: name.trim() || null,
        role,
        doctorId: role === "doctor" ? (doctorId || null) : null,
      });
      setEmail(""); setName(""); setRole("receptionist"); setDoctorId(""); setFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message || "Could not send invite.");
    }
    setSaving(false);
  };

  const toggleActive = async (member) => {
    try {
      await updateStaffMember(member.id, { active: !member.active });
      await load();
    } catch (e) {
      alert(e.message || "Could not update staff member.");
    }
  };

  const handleRemove = async (member) => {
    if (!confirm(`Remove ${member.name || member.email} from your clinic?`)) return;
    try {
      await removeStaffMember(member.id);
      await load();
    } catch (e) {
      alert(e.message || "Could not remove staff member.");
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Staff</h2>
        {!formOpen && (
          <button onClick={() => setFormOpen(true)}
            style={{ background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + Invite staff
          </button>
        )}
      </div>

      {formOpen && (
        <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email"
            style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#080c14", color: "#e2e8f0", padding: 10, fontSize: 14, marginBottom: 8 }} />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)"
            style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#080c14", color: "#e2e8f0", padding: 10, fontSize: 14, marginBottom: 10 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {ROLE_OPTIONS.map(opt => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, cursor: "pointer",
                border: role === opt.value ? "1.5px solid #1565c0" : "1px solid rgba(255,255,255,0.08)", background: role === opt.value ? "rgba(21,101,192,0.1)" : "transparent" }}>
                <input type="radio" checked={role === opt.value} onChange={() => setRole(opt.value)} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{opt.hint}</div>
                </div>
              </label>
            ))}
          </div>

          {role === "doctor" && doctors.length > 0 && (
            <select value={doctorId} onChange={e => setDoctorId(e.target.value)}
              style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#080c14", color: "#e2e8f0", padding: 10, fontSize: 14, marginBottom: 10 }}>
              <option value="">Link to which doctor profile?</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleInvite} disabled={saving}
              style={{ flex: 1, background: "#1565c0", color: "white", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Sending…" : "Send invite"}
            </button>
            <button onClick={() => setFormOpen(false)}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>}
      {!loading && staff.length === 0 && (
        <div style={{ color: "#64748b", fontSize: 13, padding: 20, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}>
          No staff invited yet — you're the only login on this clinic.
        </div>
      )}

      {staff.map(member => (
        <div key={member.id} style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{member.name || member.email}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {ROLE_LABELS[member.role]}{member.doctors?.name ? ` · ${member.doctors.name}` : ""} · {member.email}
              {!member.accepted_at && <span style={{ color: "#f59e0b" }}> · Invite pending</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => toggleActive(member)}
              style={{ fontSize: 12, fontWeight: 600, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: member.active ? "#f59e0b" : "#4ade80", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
              {member.active ? "Suspend" : "Reactivate"}
            </button>
            <button onClick={() => handleRemove(member)}
              style={{ fontSize: 12, fontWeight: 600, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#f87171", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
