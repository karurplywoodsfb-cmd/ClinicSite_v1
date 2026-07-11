// src/components/admin/DoctorProfilePage.jsx
// AdminPanel "Doctor Profile" tab — multi-doctor selector, photo upload,
// mandatory registration number (blocks publish if missing — see
// PreviewPage.jsx / hasRegNo in AdminPanel.jsx). Extracted from
// AdminPanel.jsx.

import { Field, SaveBtn } from "./ui";
import { supabase, uploadDoctorPhoto, updateDoctor } from "../../lib/supabase";

const COUNCILS = [
  "Tamil Nadu Medical Council",
  "Karnataka Medical Council",
  "Maharashtra Medical Council",
  "Delhi Medical Council",
  "Kerala State Medical Council",
  "Telangana State Medical Council",
  "West Bengal Medical Council",
  "National Medical Commission",
  "Medical Council of India",
];

export default function DoctorProfilePage({
  clinic, doctors, setDoctors, doctorEdit, setDoctorEdit,
  planContext, onRequestUpgrade, saved, saving, saveDoctor,
}) {
  const addDoctor = async () => {
    const canAdd = await planContext.checkLimit("staff_members", 1);
    if (!canAdd) {
      const limit = planContext.limits?.features?.staff_members ?? 3;
      alert(`⭐ Your plan allows up to ${limit} doctor${limit === 1 ? "" : "s"}. Upgrade to add more.`);
      onRequestUpgrade();
      return;
    }
    try {
      const { data, error } = await supabase.from("doctors").insert({
        clinic_id: clinic.id,
        name: "New Doctor",
        is_active: true,
      }).select().single();
      if (error) throw error;
      setDoctors(p => [...p, data]);
      setDoctorEdit(data);
      planContext.incrementUsage("staff_members", 1);
    } catch (e) { alert("Failed to add doctor: " + e.message); }
  };

  const removeDoctor = async () => {
    if (!confirm(`Remove ${doctorEdit.name}?`)) return;
    try {
      await supabase.from("doctors").delete().eq("id", doctorEdit.id);
      const remaining = doctors.filter(d => d.id !== doctorEdit.id);
      setDoctors(remaining);
      setDoctorEdit(remaining[0] || {});
    } catch (e) { alert("Failed: " + e.message); }
  };

  const handlePhotoUpload = async (e) => {
    if (!e.target.files?.[0] || !clinic?.id) return;
    try {
      const url = await uploadDoctorPhoto(clinic.id, e.target.files[0]);
      if (doctorEdit?.id) await updateDoctor(doctorEdit.id, { photo_url: url });
      setDoctorEdit(p => ({...p, photo_url: url}));
      setDoctors(p => p.map((d,i) => i===0 ? {...d, photo_url:url} : d));
    } catch (e) { alert("Upload failed: " + e.message); }
  };

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        {doctors.map((d, i) => (
          <button key={d.id || i} onClick={() => setDoctorEdit(d)}
            style={{
              padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all .2s",
              background: doctorEdit?.id === d.id ? "rgba(21,101,192,0.2)" : "rgba(255,255,255,0.04)",
              color: doctorEdit?.id === d.id ? "#7dd3fc" : "#64748b",
              borderLeft: doctorEdit?.id === d.id ? "3px solid #1e88e5" : "3px solid transparent",
            }}>
            {d.name || `Doctor ${i+1}`}
          </button>
        ))}
        <button onClick={addDoctor} style={{
          padding:"7px 16px", borderRadius:8,
          border:"1px dashed rgba(255,255,255,0.15)",
          background:"transparent", color:"#475569",
          cursor:"pointer", fontFamily:"inherit", fontSize:13,
        }}>
          + Add Doctor
        </button>
        {doctors.length > 1 && doctorEdit?.id && (
          <button onClick={removeDoctor} style={{
            padding:"7px 16px", borderRadius:8,
            border:"1px solid rgba(239,68,68,0.2)",
            background:"rgba(239,68,68,0.08)", color:"#f87171",
            cursor:"pointer", fontFamily:"inherit", fontSize:13,
          }}>
            Remove
          </button>
        )}
      </div>

      <div style={{ background:"rgba(255,255,255,0.02)",
        border:"1px solid rgba(255,255,255,0.07)", borderRadius:12,
        padding:20, marginBottom:20, display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ width:80, height:80, borderRadius:16,
          background:"linear-gradient(135deg,#1565c0,#a855f7)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:36, flexShrink:0, overflow:"hidden" }}>
          {doctorEdit.photo_url
            ? <img src={doctorEdit.photo_url} alt=""
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : "👨‍⚕️"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, color:"#94a3b8", marginBottom:8 }}>Doctor Photo</div>
          <input type="file" accept="image/*" id="photo-upload" style={{ display:"none" }} onChange={handlePhotoUpload}/>
          <label htmlFor="photo-upload" style={{
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)",
            color:"#94a3b8", borderRadius:8, padding:"8px 16px",
            fontSize:12, cursor:"pointer", display:"inline-block" }}>
            📷 Upload Photo
          </label>
          <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>JPG or PNG, max 5MB</div>
        </div>
      </div>

      <Field label="DOCTOR NAME *" value={doctorEdit.name}
        onChange={v => setDoctorEdit(p => ({...p, name:v}))}/>
      <Field label="DEGREE (NMC Recognised) *" value={doctorEdit.degree}
        onChange={v => setDoctorEdit(p => ({...p, degree:v}))}
        hint="e.g. BDS, MDS — IMC Ethics 2002 Cl.1.1"/>
      <Field label="SPECIALIZATION" value={doctorEdit.specialization}
        onChange={v => setDoctorEdit(p => ({...p, specialization:v}))}/>
      <Field label="YEARS OF EXPERIENCE" value={doctorEdit.experience}
        onChange={v => setDoctorEdit(p => ({...p, experience:v}))}/>

      <div style={{ marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <label style={{ fontSize:12, fontFamily:"monospace", fontWeight:600,
            color: doctorEdit.reg_number ? "#22c55e" : "#ef4444", letterSpacing:.5 }}>
            MEDICAL COUNCIL REG NO *{" "}
            {!doctorEdit.reg_number && <span style={{ fontSize:10 }}>(MANDATORY — blocks publish)</span>}
          </label>
        </div>
        <input
          value={doctorEdit.reg_number || ""}
          onChange={e => setDoctorEdit(p => ({...p, reg_number: e.target.value}))}
          placeholder="e.g. TNMC-12345"
          style={{
            width:"100%", boxSizing:"border-box",
            background: doctorEdit.reg_number ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
            border: `1.5px solid ${doctorEdit.reg_number ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.4)"}`,
            color:"#e2e8f0", borderRadius:8, padding:"10px 12px",
            fontSize:13, fontFamily:"monospace", outline:"none",
          }}/>
        <div style={{ fontSize:11, color:"#64748b", marginTop:5, lineHeight:1.5 }}>
          Required by IMC Ethics Regulations, 2002. Displayed permanently in your website footer.
          Patients can verify your registration with the Medical Council.
        </div>
      </div>

      <div style={{ marginBottom:18 }}>
        <label style={{ fontSize:12, color:"#64748b", fontFamily:"monospace",
          fontWeight:600, letterSpacing:.5, display:"block", marginBottom:6 }}>
          MEDICAL COUNCIL
        </label>
        <select
          value={doctorEdit.council_name || "Tamil Nadu Medical Council"}
          onChange={e => setDoctorEdit(p => ({...p, council_name: e.target.value}))}
          style={{ width:"100%", background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0",
            borderRadius:8, padding:"10px 12px", fontSize:13,
            fontFamily:"inherit", outline:"none" }}>
          {COUNCILS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <Field label="DOCTOR BIO" value={doctorEdit.bio}
        onChange={v => setDoctorEdit(p => ({...p, bio:v}))} multiline
        hint="Factual — no superlatives"/>

      <SaveBtn saved={saved} saving={saving} onClick={saveDoctor}
        disabled={!doctorEdit.name || !doctorEdit.degree}/>
    </div>
  );
}
