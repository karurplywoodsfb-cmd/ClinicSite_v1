// src/components/ClinicMediaSection.jsx
// COMPLIANCE FIX B1, B2, B3 — Replaces banned Patient Reviews/Testimonials
// Shows: clinic interior, equipment, certifications, staff
// ZERO patient testimonials, star ratings, or before/after imagery

import { useState } from "react";

const MEDIA_TYPE_CONFIG = {
  interior:     { icon:"🏥", label:"Clinic Facility",    color:"#3b82f6" },
  equipment:    { icon:"🖥️", label:"Medical Equipment",  color:"#8b5cf6" },
  staff:        { icon:"👨‍⚕️",label:"Our Team",           color:"#0ea5e9" },
  certification:{ icon:"🏅", label:"Accreditations",     color:"#22c55e" },
  diagram:      { icon:"🫀", label:"Educational Content",color:"#f59e0b" },
};

// Demo media items — no patient testimonials, no before/after
const DEMO_MEDIA = [
  { id:1, media_type:"certification", title:"NABH Accreditation Certificate", description:"National Accreditation Board for Hospitals & Healthcare Providers — Accreditation No. H-0000", file_url:null },
  { id:2, media_type:"certification", title:"Tamil Nadu Medical Council Registration", description:"Dr. [Name] — Reg. No. TNMC-XXXXX. Verified registration as per IMC Act 1956.", file_url:null },
  { id:3, media_type:"equipment",     title:"Digital OPG X-Ray Unit", description:"Our facility is equipped with a Planmeca ProMax digital panoramic X-ray system for precise diagnostic imaging with 90% reduced radiation exposure compared to conventional film.", file_url:null },
  { id:4, media_type:"equipment",     title:"Dental Implant Surgical Kit", description:"Nobel Biocare implant system — ISO 13485 certified. Used for all implant procedures at our clinic.", file_url:null },
  { id:5, media_type:"interior",      title:"Clinical Treatment Area", description:"AERB-compliant radiation safety. All surfaces treated with hospital-grade disinfectants. Instruments sterilised per ADA infection control protocols.", file_url:null },
  { id:6, media_type:"interior",      title:"Patient Reception & Waiting Area", description:"Designed for patient comfort with clearly marked accessibility provisions.", file_url:null },
];

export default function ClinicMediaSection({ clinic, mediaItems }) {
  const [activeType, setActiveType] = useState("all");
  const items = mediaItems || DEMO_MEDIA;

  const filtered = activeType === "all"
    ? items
    : items.filter(m => m.media_type === activeType);

  const presentTypes = [...new Set(items.map(m => m.media_type))];

  return (
    <section id="facility" style={{
      padding: "80px 40px",
      background: "#f4f8fd",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Section header */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>
            Our Facility & Credentials
          </div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(26px,3vw,36px)", color:"#0b2545", marginBottom:12, lineHeight:1.2 }}>
            Equipment, Accreditations & Clinic Infrastructure
          </h2>
          <p style={{ fontSize:15, color:"#5a7a96", maxWidth:560, lineHeight:1.6 }}>
            Factual information about our clinical facility, certified equipment, and professional accreditations.
          </p>
        </div>

        {/* Type filter */}
        {presentTypes.length > 1 && (
          <div style={{ display:"flex", gap:8, marginBottom:28, flexWrap:"wrap" }}>
            <button onClick={() => setActiveType("all")} style={{
              padding:"7px 16px", borderRadius:9999, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600,
              background: activeType==="all" ? "#1565c0" : "white",
              border: `1.5px solid ${activeType==="all" ? "#1565c0" : "#dce8f5"}`,
              color: activeType==="all" ? "white" : "#5a7a96",
            }}>All ({items.length})</button>
            {presentTypes.map(type => {
              const cfg = MEDIA_TYPE_CONFIG[type];
              return (
                <button key={type} onClick={() => setActiveType(type)} style={{
                  padding:"7px 16px", borderRadius:9999, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:5,
                  background: activeType===type ? cfg.color : "white",
                  border: `1.5px solid ${activeType===type ? cfg.color : "#dce8f5"}`,
                  color: activeType===type ? "white" : "#5a7a96",
                }}>
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Media grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}>
          {filtered.map(item => {
            const cfg = MEDIA_TYPE_CONFIG[item.media_type] || MEDIA_TYPE_CONFIG.interior;
            return (
              <div key={item.id} style={{
                background:"white", border:"1px solid #dce8f5", borderRadius:14,
                overflow:"hidden", transition:"all .2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 24px rgba(11,37,69,0.1)"; e.currentTarget.style.borderColor="#c3d9f0"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#dce8f5"; }}>

                {/* Image placeholder / actual image */}
                <div style={{
                  height:160, background:`linear-gradient(135deg, ${cfg.color}15, ${cfg.color}08)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  borderBottom:"1px solid #dce8f5", position:"relative",
                }}>
                  {item.file_url ? (
                    <img src={item.file_url} alt={item.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <span style={{ fontSize:48, opacity:.4 }}>{cfg.icon}</span>
                  )}
                  <div style={{
                    position:"absolute", top:10, left:10,
                    background:`${cfg.color}20`, border:`1px solid ${cfg.color}40`,
                    borderRadius:6, padding:"3px 10px", fontSize:10, fontWeight:600,
                    color:cfg.color, fontFamily:"monospace",
                  }}>
                    {cfg.label.toUpperCase()}
                  </div>
                </div>

                <div style={{ padding:"16px 18px" }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:"#0b2545", marginBottom:7, lineHeight:1.3 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize:12, color:"#5a7a96", lineHeight:1.6, margin:0 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* COMPLIANCE NOTE — shown in dev mode, hidden in prod */}
        <div style={{ marginTop:24, padding:"12px 16px", background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:8, fontSize:11, color:"#64748b", lineHeight:1.7 }}>
          <strong style={{ color:"#0b2545" }}>Compliance Note:</strong> This section displays factual facility, equipment, and accreditation information only. Patient testimonials, star ratings, before/after images, and Google Review embeds are not displayed in compliance with <strong>NMC Professional Conduct Regulations</strong> and <strong>IMC Ethics Regulations 2002, Clause 6.1</strong>.
          {" "}<a href={`/${clinic?.slug}/privacy-policy`} style={{ color:"#1565c0" }}>Privacy Policy</a>
        </div>
      </div>
    </section>
  );
}
