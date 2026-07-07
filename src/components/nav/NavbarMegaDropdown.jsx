// src/components/nav/NavbarMegaDropdown.jsx
// Dark nav bar — hovering/focusing "Services" opens a grid of active services
// instead of forcing a scroll down the page.
// Props: clinic, C (colors), isMobile, handleBook, services, fontHeading

import { useState } from "react";

export default function NavbarMegaDropdown({
  clinic, C, isMobile, handleBook, services = [],
  fontHeading = "'DM Serif Display',serif",
}) {
  const [open, setOpen] = useState(false);
  const topServices = services.filter(s => s.is_active !== false).slice(0, 6);

  return (
    <nav
      style={{ position:"relative", zIndex:150 }}
      onMouseLeave={() => setOpen(false)}
    >
      <div style={{
        background: C.dark || C.text, display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"18px 32px",
      }}>
        <div style={{ fontFamily:fontHeading, fontSize:18, color:"#fff" }}>{clinic.name}</div>
        {!isMobile && (
          <div style={{ display:"flex", gap:28, alignItems:"center", fontSize:13, color:"#c8ccd2" }}>
            <span
              onMouseEnter={() => setOpen(true)}
              style={{
                color:"#fff", fontWeight:600, cursor:"pointer",
                borderBottom: open ? `2px solid ${C.accent}` : "2px solid transparent",
                paddingBottom:4,
              }}
            >
              Services {topServices.length > 0 ? "▾" : ""}
            </span>
            <a href="#doctor" style={{ color:"#c8ccd2", textDecoration:"none" }}>Doctor</a>
            <a href="#contact" style={{ color:"#c8ccd2", textDecoration:"none" }}>Contact</a>
            <button onClick={handleBook} style={{
              background:C.accent, color:"#fff", border:"none", borderRadius:6,
              padding:"10px 20px", fontWeight:600, fontSize:13, cursor:"pointer",
            }}>
              Book Appointment
            </button>
          </div>
        )}
        {isMobile && (
          <button onClick={handleBook} style={{
            background:C.accent, color:"#fff", border:"none", borderRadius:6,
            padding:"9px 18px", fontWeight:600, fontSize:12, cursor:"pointer",
          }}>
            Book
          </button>
        )}
      </div>

      {open && topServices.length > 0 && (
        <div style={{
          background:"#fff", padding:"24px 32px", display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16,
          borderTop:"1px solid #eee", boxShadow:"0 12px 24px rgba(0,0,0,0.1)",
        }}>
          {topServices.map((svc, i) => (
            <a key={svc.id || i} href="#services" onClick={() => setOpen(false)} style={{ textDecoration:"none" }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"#eef1f4", marginBottom:8,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
                {svc.icon || "🩺"}
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{svc.name}</div>
              {svc.price && !svc.hide_price && (
                <div style={{ fontSize:11, color:C.muted }}>From {svc.price}</div>
              )}
            </a>
          ))}
          <a href="#services" onClick={() => setOpen(false)} style={{
            background:"#f4f6f8", borderRadius:10, padding:10, display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:12, color:C.accent2 || C.accent,
            fontWeight:600, textDecoration:"none",
          }}>
            View all services →
          </a>
        </div>
      )}
    </nav>
  );
}
