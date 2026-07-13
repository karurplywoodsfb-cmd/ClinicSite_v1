// src/components/admin/ClinicInfoPage.jsx
// AdminPanel "Clinic Info" tab — logo upload + brand/contact fields.
// Extracted from AdminPanel.jsx. `clinicEdit` is a parent-owned draft of
// `clinic` (kept in sync on load); this page edits the draft locally via
// `setClinicEdit` and persists it via `saveClinicInfo` (a `doSave({...})`
// call defined in the parent — see AdminPanel.jsx's save helpers).

import { Field, SaveBtn } from "./ui";
import { supabase, updateClinic } from "../../lib/supabase";

export default function ClinicInfoPage({
  clinic, clinicEdit, setClinicEdit, setClinic,
  onClinicUpdate, saved, saving, saveClinicInfo,
}) {
  const handleLogoUpload = async (e) => {
    if (!e.target.files?.[0] || !clinic?.id) return;
    try {
      const file = e.target.files[0];
      const ext  = file.name.split(".").pop();
      const path = `${clinic.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("clinic-media")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("clinic-media")
        .getPublicUrl(path);
      const updated = await updateClinic(clinic.id, { logo_url: publicUrl });
      setClinic(updated);
      setClinicEdit(updated);
      onClinicUpdate?.(updated);
    } catch (e) { alert("Logo upload failed: " + e.message); }
  };

  const removeLogo = async () => {
    const updated = await updateClinic(clinic.id, { logo_url: null });
    setClinic(updated); setClinicEdit(updated); onClinicUpdate?.(updated);
  };

  const handleHeroUpload = async (e) => {
    if (!e.target.files?.[0] || !clinic?.id) return;
    try {
      const file = e.target.files[0];
      const ext  = file.name.split(".").pop();
      const path = `${clinic.id}/hero.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("clinic-media")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("clinic-media")
        .getPublicUrl(path);
      const updated = await updateClinic(clinic.id, { hero_image_url: publicUrl });
      setClinic(updated);
      setClinicEdit(updated);
      onClinicUpdate?.(updated);
    } catch (e) { alert("Hero image upload failed: " + e.message); }
  };

  const removeHeroImage = async () => {
    const updated = await updateClinic(clinic.id, { hero_image_url: null });
    setClinic(updated); setClinicEdit(updated); onClinicUpdate?.(updated);
  };

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{
        background:"rgba(255,255,255,0.02)",
        border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:12, padding:20, marginBottom:20,
      }}>
        <div style={{ fontSize:11, fontFamily:"monospace", fontWeight:600,
          color:"#64748b", letterSpacing:.5, marginBottom:14 }}>CLINIC LOGO</div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{
            width:80, height:80, borderRadius:12, overflow:"hidden",
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            {clinicEdit.logo_url
              ? <img src={clinicEdit.logo_url} alt="Logo"
                  style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
              : <div style={{ fontSize:28, color:"#334155" }}>
                  {(clinicEdit.name||"C").charAt(0).toUpperCase()}
                </div>
            }
          </div>
          <div>
            <input type="file" accept="image/*" id="logo-upload" style={{ display:"none" }} onChange={handleLogoUpload}/>
            <label htmlFor="logo-upload" style={{
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.12)",
              color:"#94a3b8", borderRadius:8, padding:"8px 16px",
              fontSize:12, cursor:"pointer", display:"inline-block",
            }}>
              📷 Upload Logo
            </label>
            <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>
              PNG or SVG recommended · Max 2MB · Will show in navbar
            </div>
            {clinicEdit.logo_url && (
              <button onClick={removeLogo} style={{
                marginTop:8, fontSize:11, color:"#f87171", background:"none",
                border:"none", cursor:"pointer", padding:0,
              }}>Remove logo</button>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background:"rgba(255,255,255,0.02)",
        border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:12, padding:20, marginBottom:20,
      }}>
        <div style={{ fontSize:11, fontFamily:"monospace", fontWeight:600,
          color:"#64748b", letterSpacing:.5, marginBottom:14 }}>HERO BACKGROUND IMAGE</div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{
            width:140, height:80, borderRadius:10, overflow:"hidden",
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            {clinicEdit.hero_image_url
              ? <img src={clinicEdit.hero_image_url} alt="Hero background"
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <div style={{ fontSize:22 }}>🖼️</div>
            }
          </div>
          <div>
            <input type="file" accept="image/*" id="hero-upload" style={{ display:"none" }} onChange={handleHeroUpload}/>
            <label htmlFor="hero-upload" style={{
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.12)",
              color:"#94a3b8", borderRadius:8, padding:"8px 16px",
              fontSize:12, cursor:"pointer", display:"inline-block",
            }}>
              📷 Upload Hero Image
            </label>
            <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>
              Landscape photo recommended (clinic exterior, lobby, treatment room) · Max 5MB
            </div>
            {clinicEdit.hero_image_url && (
              <button onClick={removeHeroImage} style={{
                marginTop:8, fontSize:11, color:"#f87171", background:"none",
                border:"none", cursor:"pointer", padding:0,
              }}>Remove hero image</button>
            )}
          </div>
        </div>
      </div>

      <Field label="CLINIC NAME"    value={clinicEdit.name}
        onChange={v => setClinicEdit(p => ({...p, name:v}))}/>
      <Field label="TAGLINE"        value={clinicEdit.tagline}
        onChange={v => setClinicEdit(p => ({...p, tagline:v}))}
        hint="Factual descriptor only — no superlatives (IMC Ethics 2002)"/>
      <Field label="HERO HEADLINE"  value={clinicEdit.heroTagline}
        onChange={v => setClinicEdit(p => ({...p, heroTagline:v}))}
        hint="Large text shown on the website hero section. Keep it short — 4 to 6 words."/>
      <Field label="SPECIALTY"      value={clinicEdit.specialty}
        onChange={v => setClinicEdit(p => ({...p, specialty:v}))}
        hint="e.g. Dental, Dermatology, General Practice"/>
      <Field label="CITY"           value={clinicEdit.city}
        onChange={v => setClinicEdit(p => ({...p, city:v}))}/>
      <Field label="PHONE"          value={clinicEdit.phone}
        onChange={v => setClinicEdit(p => ({...p, phone:v}))}/>
      <Field label="WHATSAPP"       value={clinicEdit.whatsapp}
        onChange={v => setClinicEdit(p => ({...p, whatsapp:v}))}/>
      <Field label="EMAIL"          value={clinicEdit.email}
        onChange={v => setClinicEdit(p => ({...p, email:v}))}/>
      <Field label="ADDRESS"        value={clinicEdit.address}
        onChange={v => setClinicEdit(p => ({...p, address:v}))} multiline/>
      <Field label="ABOUT CLINIC"   value={clinicEdit.about}
        onChange={v => setClinicEdit(p => ({...p, about:v}))} multiline
        hint="Educational, factual — no superlatives"/>

      <div style={{ padding:"10px 14px", background:"rgba(245,158,11,0.06)",
        border:"1px solid rgba(245,158,11,0.2)", borderRadius:8,
        fontSize:11, color:"#f59e0b", marginBottom:18, lineHeight:1.6 }}>
        ⚠ Do not use: 'best', 'most trusted', 'painless', 'guaranteed', '#1' — prohibited by IMC Ethics Regulations 2002 & DMR Act 1954
      </div>
      <SaveBtn saved={saved} saving={saving} onClick={saveClinicInfo}/>
    </div>
  );
}
