// src/components/ClinicFooter.jsx
// COMPLIANCE FIX D1 — Mandatory Medical Council Reg No. display
// COMPLIANCE FIX E2 — Privacy Policy link
// Replaces inline footer in ClinicSite.jsx

import WorkingHoursDisplay from "./WorkingHoursDisplay";

export default function ClinicFooter({ clinic, doctor, hours = [] }) {
  const regNo      = doctor?.reg_number   || clinic?.doctor_reg_no;
  const council    = doctor?.council_name || "Medical Council of India";
  const docName    = doctor?.name;
  const docDegree  = doctor?.degree;

  return (
    <footer style={{
      background: "#0b2545",
      color: "white",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Main footer content */}
      <div style={{ padding:"40px 24px 28px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:48, marginBottom:32 }}>
          <div>
            <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, margin:"0 0 10px" }}>
              {clinic?.name}
            </h3>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7, maxWidth:280, margin:"0 0 16px" }}>
              {clinic?.specialty} clinic serving {clinic?.city}, Tamil Nadu. Committed to evidence-based patient care.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <a href={`https://wa.me/${(clinic?.whatsapp||"").replace(/\D/g,"")}`} style={{ background:"#25d366", color:"white", padding:"7px 14px", borderRadius:6, fontSize:12, fontWeight:600, textDecoration:"none" }}>💬 WhatsApp</a>
              <a href={`tel:${clinic?.phone}`} style={{ background:"rgba(255,255,255,0.1)", color:"white", padding:"7px 14px", borderRadius:6, fontSize:12, fontWeight:600, textDecoration:"none" }}>📞 Call</a>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize:13, fontWeight:600, letterSpacing:1, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:14 }}>Services</h4>
            {(clinic?.services || ["General Checkup","Consultation","Specialist Care"]).slice(0,5).map((s,i) => (
              <a key={i} href="#services" style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.6)", textDecoration:"none", marginBottom:8 }}>{typeof s === "string" ? s : s.name}</a>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize:13, fontWeight:600, letterSpacing:1, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:14 }}>Hours</h4>
            {hours.length > 0
              ? <WorkingHoursDisplay hours={hours} style={{ fontSize:12 }}/>
              : [["About Us","#doctor"],["Our Services","#services"],["Location & Hours","#contact"],["Book Appointment","#book"],["Privacy Policy",`/${clinic?.slug}/privacy-policy`]].map(([label, href]) => (
                  <a key={label} href={href} style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.6)", textDecoration:"none", marginBottom:8 }}>{label}</a>
                ))
            }
          </div>
        </div>
      </div>

      {/* ── COMPLIANCE STRIP — IMC Reg No. (Fix D1) ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.2)",
        padding: "14px 24px",
      }}>
        <div style={{ width:"100%" }}>

          {/* Reg No. display — MANDATORY under IMC Ethics Regulations 2002 */}
          {regNo ? (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderLeft: "3px solid #1e88e5",
              borderRadius: 6,
              padding: "10px 16px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}>
              <div style={{ fontSize:11, fontFamily:"monospace", color:"rgba(255,255,255,0.4)", letterSpacing:1 }}>
                MEDICAL REGISTRATION
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.85)", fontFamily:"monospace" }}>
                {docName && <span>{docName}{docDegree ? `, ${docDegree}` : ""} — </span>}
                Reg No: <span style={{ color:"#7dd3fc" }}>{regNo}</span>
                {council && <span style={{ color:"rgba(255,255,255,0.5)", fontWeight:400 }}> · {council}</span>}
              </div>
              <div style={{ marginLeft:"auto", fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"monospace" }}>
                As required by IMC Ethics Regulations, 2002
              </div>
            </div>
          ) : (
            // Warning shown in admin/dev — not shown to patients if missing
            process.env.NODE_ENV === "development" && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, padding:"8px 16px", marginBottom:12, fontSize:11, color:"#fca5a5", fontFamily:"monospace" }}>
                ⚠ COMPLIANCE WARNING: Medical Council Registration Number is missing.
                This is MANDATORY under IMC Ethics Regulations 2002.
                Add it via Admin Panel → Doctor Profile → Reg. Number.
              </div>
            )
          )}

          {/* Copyright + compliance links */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", margin:0 }}>
              © {new Date().getFullYear()} {clinic?.name} · {clinic?.city}, Tamil Nadu
            </p>
            <div style={{ display:"flex", gap:16 }}>
              <a href={`/${clinic?.slug}/privacy-policy`} style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textDecoration:"none" }}>Privacy Policy</a>
              <a href={`/${clinic?.slug}/terms`} style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textDecoration:"none" }}>Terms of Use</a>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)", fontFamily:"monospace" }}>
                Powered by WaSpace
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}