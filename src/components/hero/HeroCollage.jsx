// src/components/hero/HeroCollage.jsx
// Overlapping photo tiles (doctor + clinic photos) instead of one flat image block.
// Props: clinic, doctor, media, C (colors), isMobile, handleBook, fontHeading

export default function HeroCollage({
  clinic, doctor, media = [], C, isMobile, handleBook,
  fontHeading = "'DM Serif Display',serif",
}) {
  const photoA = doctor?.photo_url || media?.[0]?.url;
  const photoB = media?.[1]?.url || media?.[0]?.url;

  return (
    <section style={{
      padding: isMobile ? "40px 20px" : "56px 40px",
      display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap:40, alignItems:"center", background:C.bg,
    }}>
      <div>
        <div style={{
          display:"inline-block", border:`1px solid ${C.border}`, borderRadius:4,
          padding:"6px 14px", fontSize:11, fontWeight:600, color:C.accent2 || C.accent,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:20,
        }}>
          {clinic.specialty ? `${clinic.specialty} · ${clinic.city || ""}` : "Established Practice"}
        </div>
        <h1 style={{ fontFamily:fontHeading, fontSize:"clamp(26px,4vw,34px)", color:C.text, lineHeight:1.25, marginBottom:18 }}>
          {clinic.heroTagline || "Clarity in every diagnosis."}
        </h1>
        <p style={{ fontSize:14, color:C.muted, lineHeight:1.7, maxWidth:380, marginBottom:22 }}>
          {clinic.about || `A calm, unhurried clinic built around precise answers at ${clinic.name}.`}
        </p>
        <button onClick={handleBook} style={{
          background:C.dark || C.accent, color:"#fff", border:"none", borderRadius:6,
          padding:"13px 26px", fontSize:13, fontWeight:600, cursor:"pointer",
        }}>
          Book an appointment
        </button>
      </div>
      <div style={{ position:"relative", height: isMobile ? 200 : 280 }}>
        <div style={{
          position:"absolute", top:0, left:0, width:"65%", height:"70%",
          background:"#dfe4e9", borderRadius:12, boxShadow:"0 12px 30px rgba(0,0,0,0.1)", overflow:"hidden",
        }}>
          {photoA && <img src={photoA} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
        </div>
        <div style={{
          position:"absolute", bottom:0, right:0, width:"55%", height:"55%",
          background:"#c8d2db", borderRadius:12, boxShadow:"0 12px 30px rgba(0,0,0,0.14)",
          border:`4px solid ${C.bg}`, overflow:"hidden",
        }}>
          {photoB && <img src={photoB} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
        </div>
      </div>
    </section>
  );
}
