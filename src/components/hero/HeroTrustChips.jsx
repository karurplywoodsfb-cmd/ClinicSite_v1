// src/components/hero/HeroTrustChips.jsx
// Headline + a row of quick-scan trust chips instead of one static badge.
// Props: clinic, doctor, C (colors), isMobile, handleBook, fontHeading

export default function HeroTrustChips({
  clinic, doctor, C, isMobile, handleBook,
  fontHeading = "'Fraunces',serif",
}) {
  const chips = [
    "Same-day slots available",
    clinic.years_experience ? `${clinic.years_experience}+ years serving ${clinic.city || "the community"}` : `Serving ${clinic.city || "the community"}`,
    clinic.doctor_count > 1 ? `${clinic.doctor_count} specialists on staff` : null,
  ].filter(Boolean);

  return (
    <section style={{
      padding: isMobile ? "40px 20px" : "56px 40px",
      display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
      gap:40, alignItems:"center", background:C.bg,
    }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.accent, marginBottom:14 }}>
          Now accepting new patients
        </div>
        <h1 style={{ fontFamily:fontHeading, fontWeight:600, fontSize:"clamp(30px,4.5vw,42px)", color:C.text, lineHeight:1.15, marginBottom:18 }}>
          {clinic.heroTagline || "Care that feels like coming home."}
        </h1>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 }}>
          {chips.map((chip, i) => (
            <div key={i} style={{
              background:C.surface || "#fff", borderRadius:20, padding:"7px 14px",
              fontSize:12, color:C.text, fontWeight:600, border:`1px solid ${C.border}`,
            }}>
              ✓ {chip}
            </div>
          ))}
        </div>
        <button onClick={handleBook} style={{
          background:C.dark || C.text, color:"#fff", border:"none", borderRadius:30,
          padding:"14px 28px", fontSize:14, fontWeight:600, cursor:"pointer",
        }}>
          Book an appointment
        </button>
      </div>
      <div style={{
        background:"#e3c9b5", borderRadius:20, height: isMobile ? 200 : 300, overflow:"hidden",
      }}>
        {doctor?.photo_url && (
          <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        )}
      </div>
    </section>
  );
}
