// src/components/hero/HeroQuickBook.jsx
// The hero includes a real service selector. Choosing a service and clicking
// "Find a slot" opens the actual BookingEngine modal (via handleBook) with
// that service pre-selected — reuses your existing booking flow rather than
// duplicating its logic inline.
// Props: clinic, C (colors), isMobile, handleBook, services, fontHeading

import { useState } from "react";

export default function HeroQuickBook({
  clinic, C, isMobile, handleBook, services = [],
  fontHeading = "'Space Grotesk',sans-serif",
}) {
  const activeServices = services.filter(s => s.is_active !== false);
  const [selected, setSelected] = useState("");

  return (
    <section style={{ padding: isMobile ? "40px 20px" : "56px 40px", textAlign:"center", background:C.bg }}>
      <div style={{
        display:"inline-block", background:C.surface || "#fff", color:C.accent,
        fontSize:12, fontWeight:600, padding:"6px 16px", borderRadius:20, marginBottom:18,
      }}>
        {clinic.specialty ? `${clinic.specialty} · ${clinic.city || ""}` : "Trusted care, made simple"}
      </div>
      <h1 style={{
        fontFamily:fontHeading, fontSize:"clamp(26px,4vw,36px)", fontWeight:700,
        color:C.dark || C.text, marginBottom:24, maxWidth:600, margin:"0 auto 24px",
      }}>
        What brings you in today?
      </h1>
      <div style={{
        maxWidth:560, margin:"0 auto", background:C.surface || "#fff", borderRadius:16,
        padding:8, display:"flex", flexDirection: isMobile ? "column" : "row", gap:8,
        boxShadow:"0 10px 30px rgba(0,0,0,0.08)",
      }}>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{
            flex:1, textAlign:"left", padding:"12px 16px", color:selected ? C.text : C.muted,
            fontSize:13, border:"none", background:"transparent", outline:"none",
          }}
        >
          <option value="">Select a service — General Checkup, Diagnostics...</option>
          {activeServices.map((svc, i) => (
            <option key={svc.id || i} value={svc.id || svc.name}>{svc.name}</option>
          ))}
        </select>
        <button
          onClick={() => handleBook(selected)}
          style={{
            background:C.accent, color:"#fff", border:"none", borderRadius:10,
            padding:"12px 26px", fontSize:13, fontWeight:600, whiteSpace:"nowrap", cursor:"pointer",
          }}
        >
          Find a slot →
        </button>
      </div>
      <div style={{ marginTop:14, fontSize:12, color:C.muted }}>
        or {clinic.phone
          ? <a href={`tel:${clinic.phone}`} style={{ color:C.muted, textDecoration:"underline" }}>call the clinic directly</a>
          : "call the clinic directly"}
      </div>
    </section>
  );
}
