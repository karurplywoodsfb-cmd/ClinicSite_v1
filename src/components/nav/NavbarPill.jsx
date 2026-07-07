// src/components/nav/NavbarPill.jsx
// Floating, rounded nav that detaches from the top edge and shrinks on scroll.
// Props: clinic, C (colors), isMobile, handleBook, navLinks, fontHeading

import { useState, useEffect } from "react";

export default function NavbarPill({
  clinic, C, isMobile, handleBook,
  navLinks = [["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]],
  fontHeading = "'Fraunces',serif",
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position:"sticky", top:0, zIndex:150,
      padding: scrolled ? "10px 20px" : "18px 24px",
      transition:"padding .25s ease",
      background:"transparent",
    }}>
      <div style={{
        maxWidth: scrolled ? 640 : 900,
        margin:"0 auto",
        background: C.surface || "#fff",
        borderRadius:40,
        padding: scrolled ? "8px 8px 8px 18px" : "12px 12px 12px 22px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        boxShadow: scrolled ? "0 6px 18px rgba(0,0,0,0.12)" : "0 8px 24px rgba(0,0,0,0.08)",
        transition:"max-width .25s ease, padding .25s ease, box-shadow .25s ease",
      }}>
        <div style={{ fontFamily:fontHeading, fontWeight:600, fontSize: scrolled ? 15 : 17, color:C.text, whiteSpace:"nowrap" }}>
          {clinic.name}
        </div>
        <div style={{ display:"flex", gap:18, alignItems:"center" }}>
          {!isMobile && !scrolled && navLinks.map(([label, href]) => (
            <a key={label} href={href} style={{ textDecoration:"none", color:C.muted, fontSize:13, fontWeight:500 }}>
              {label}
            </a>
          ))}
          <button onClick={handleBook} style={{
            background:C.accent, color:"#fff", border:"none", borderRadius:30,
            padding: scrolled ? "8px 18px" : "10px 22px",
            fontSize: scrolled ? 12 : 13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
          }}>
            Book Visit
          </button>
        </div>
      </div>
    </div>
  );
}
