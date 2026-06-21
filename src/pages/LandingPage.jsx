// src/pages/LandingPage.jsx
// Public marketing landing page — shown at clinicsite.in/

export default function LandingPage() {
  return (
    <div style={{
      minHeight:"100vh", background:"#080c14", color:"white",
      fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:40, textAlign:"center",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div style={{
        width:60, height:60, borderRadius:16,
        background:"linear-gradient(135deg,#1565c0,#1e88e5)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:30, marginBottom:24, boxShadow:"0 8px 32px rgba(21,101,192,0.4)",
      }}>🏥</div>

      <div style={{
        fontFamily:"'DM Serif Display',serif",
        fontSize:"clamp(36px,5vw,64px)", lineHeight:1.1,
        marginBottom:20, maxWidth:700,
      }}>
        Your Clinic Website<br/>
        <em style={{ fontStyle:"italic", color:"#1e88e5" }}>in 10 Minutes</em>
      </div>

      <p style={{ fontSize:18, color:"rgba(255,255,255,0.55)", maxWidth:500, lineHeight:1.7, marginBottom:40 }}>
        Built for Indian clinics. Auto-SEO. Appointment booking. DPDP-compliant. Free to start.
      </p>

      <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", marginBottom:60 }}>
        <a href="/login" style={{
          background:"#1565c0", color:"white", textDecoration:"none",
          borderRadius:12, padding:"16px 36px", fontSize:16, fontWeight:700,
          boxShadow:"0 8px 24px rgba(21,101,192,0.4)",
        }}>
          Get Started Free →
        </a>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:20, maxWidth:700, width:"100%" }}>
        {[
          ["🏥","6.5L+ Clinics","In India, mostly undigitised"],
          ["⏱️","10 Minutes","From signup to live site"],
          ["⚖️","DPDP Compliant","Built for Indian medical law"],
        ].map(([icon,title,sub]) => (
          <div key={title} style={{
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:12, padding:20,
          }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{title}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
