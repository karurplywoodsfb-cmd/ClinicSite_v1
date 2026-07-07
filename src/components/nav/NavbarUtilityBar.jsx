// src/components/nav/NavbarUtilityBar.jsx
// Thin info strip (phone / hours / emergency note) above the main nav bar.
// Reads as an established institution rather than a template site.
// Props: clinic, C (colors), isMobile, handleBook, fontHeading

export default function NavbarUtilityBar({
  clinic, C, isMobile, handleBook,
  fontHeading = "'DM Serif Display',serif",
}) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:150 }}>
      {!isMobile && (
        <div style={{
          background:C.dark || C.accent, color:"#fff", opacity:0.92,
          fontSize:11, padding:"8px 32px", display:"flex", justifyContent:"space-between",
        }}>
          <span>
            {clinic.phone ? `📞 ${clinic.phone}` : ""}
            {clinic.phone && " · "}
            ⏰ Mon–Sat, 9AM–8PM
          </span>
          <span>🚨 Emergency: call directly, don't wait to book online</span>
        </div>
      )}
      <div style={{
        background:C.surface || "#fff", padding:"18px 32px", display:"flex",
        justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:6, background:C.dark || C.accent, color:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700,
          }}>
            {(clinic.name || "C").charAt(0).toUpperCase()}
          </div>
          <div style={{ fontFamily:fontHeading, fontSize:18, color:C.text }}>{clinic.name}</div>
        </div>
        <div style={{ display:"flex", gap:26, alignItems:"center", fontSize:13, color:C.muted }}>
          {!isMobile && (
            <>
              <a href="#services" style={{ color:C.muted, textDecoration:"none" }}>Services</a>
              <a href="#doctor" style={{ color:C.muted, textDecoration:"none" }}>Doctor</a>
              <a href="#contact" style={{ color:C.muted, textDecoration:"none" }}>Contact</a>
            </>
          )}
          <button onClick={handleBook} style={{
            background:C.dark || C.accent, color:"#fff", border:"none", borderRadius:6,
            padding:"10px 22px", fontWeight:600, fontSize:13, cursor:"pointer",
          }}>
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
