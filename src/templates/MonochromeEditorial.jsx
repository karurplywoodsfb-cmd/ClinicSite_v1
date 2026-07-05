// src/templates/MonochromeEditorial.jsx
// Bold, confident, editorial — black on white, oversized serif type, newspaper grid
// Accepts: clinic, services, doctors, media, hours, onBookClick

import { useState, useEffect, useRef } from "react";
import BookingEngine        from "../components/BookingEngine";
import ClinicFooter         from "../components/ClinicFooter";
import ClinicMediaSection   from "../components/ClinicMediaSection";

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : "translateY(16px)",
      transition: `opacity .5s ${delay}s ease, transform .5s ${delay}s ease`,
    }}>
      {children}
    </div>
  );
}

export default function MonochromeEditorial({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else setShowBook(true);
  };

  const C = {
    bg:     "#ffffff",
    text:   "#111111",
    muted:  "#666666",
    border: "#dddddd",
    accent: clinic.accent_color || "#111111",
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:C.bg, color:C.text, overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300,
            background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={() => setShowBook(false)} style={{
              position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:"#fff",
              border:`2px solid ${C.text}`, cursor:"pointer", fontSize:16 }}>✕</button>
            <BookingEngine hours={hours} branches={branches} clinic={clinic} services={activeServices}/>
          </div>
        </div>
      )}

      {/* ── Top line ── */}
      <div style={{ borderBottom:`2px solid ${C.text}`, padding:"12px 40px", display:"flex",
        justifyContent:"space-between", fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>
        <span>{clinic.city ? `Est. in ${clinic.city}` : "Est."}</span>
        <span>{clinic.phone || ""}</span>
      </div>

      {/* ── Navbar ── */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"22px 40px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:24, letterSpacing:-1 }}>{clinic.name}</div>
        <div style={{ display:"flex", gap:26, alignItems:"center" }}>
          {[["Services","#services"],["Team","#doctor"],["Contact","#contact"]].map(([l,h]) => (
            <a key={l} href={h} style={{ textDecoration:"none", color:C.text, fontSize:12,
              textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background:"transparent", border:`2px solid ${C.text}`, color:C.text,
            padding:"9px 20px", fontSize:12, fontWeight:700, textTransform:"uppercase",
            letterSpacing:1, cursor:"pointer" }}>
            Book
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding:"56px 40px 44px", borderBottom:`1px solid ${C.border}` }}>
        <Reveal>
          <div style={{ fontSize:12, letterSpacing:2, textTransform:"uppercase", color:C.muted, marginBottom:20 }}>
            {clinic.specialty ? `A clinic for ${clinic.specialty.toLowerCase()}` : "A clinic built on trust"}
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(38px,7vw,74px)", lineHeight:0.98,
            fontWeight:900, letterSpacing:-2, maxWidth:900 }}>
            {clinic.heroTagline || "Health, handled properly."}
          </h1>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:30, gap:24, flexWrap:"wrap" }}>
            <p style={{ fontSize:15, maxWidth:360, color:"#333", lineHeight:1.7 }}>
              {clinic.about || `${clinic.name} offers clear diagnosis and honest treatment, on time, every time.`}
            </p>
            <button onClick={handleBook} style={{
              border:`2px solid ${C.text}`, background:C.text, color:"#fff",
              padding:"15px 32px", fontSize:13, fontWeight:700, textTransform:"uppercase",
              letterSpacing:1, cursor:"pointer" }}>
              Book a visit →
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── Services grid ── */}
      {activeServices.length > 0 && (
        <section id="services" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", borderBottom:`1px solid ${C.border}` }}>
          {activeServices.map((svc, i) => (
            <Reveal key={svc.id||i} delay={i*0.04}>
              <div style={{ padding:"30px 24px", borderRight:`1px solid ${C.border}`, height:"100%" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, color:"#999", marginBottom:14 }}>
                  {String(i+1).padStart(2,"0")}
                </div>
                <h4 style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{svc.name}</h4>
                {svc.description && <p style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{svc.description}</p>}
                {svc.price && !svc.hide_price && <div style={{ fontSize:12, fontWeight:700, marginTop:10 }}>{svc.price}</div>}
              </div>
            </Reveal>
          ))}
        </section>
      )}

      {/* ── Doctor ── */}
      {doctor && (
        <section id="doctor" style={{ padding:"56px 40px", borderBottom:`1px solid ${C.border}`,
          display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:56, alignItems:"center" }}>
          <Reveal>
            <div style={{ width:"100%", aspectRatio:"4/5", background:"#f2f2f2", border:`1px solid ${C.border}`,
              display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
              {doctor.photo_url
                ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover", filter:"grayscale(15%)" }}/>
                : <span style={{ fontSize:80 }}>🩺</span>}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ fontSize:12, letterSpacing:2, textTransform:"uppercase", color:C.muted, marginBottom:12 }}>The team</div>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:34, fontWeight:700, marginBottom:8 }}>{doctor.name}</h2>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>{doctor.degree}</div>
            {doctor.reg_number && (
              <div style={{ fontSize:11, color:C.muted, marginBottom:20, fontFamily:"monospace" }}>
                Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}
              </div>
            )}
            {doctor.bio && <p style={{ color:"#333", lineHeight:1.8, fontSize:15, marginBottom:26, maxWidth:520 }}>{doctor.bio}</p>}
            <button onClick={handleBook} style={{
              border:`2px solid ${C.text}`, background:"transparent", color:C.text,
              padding:"13px 26px", fontSize:13, fontWeight:700, textTransform:"uppercase",
              letterSpacing:1, cursor:"pointer" }}>
              Book a consultation
            </button>
          </Reveal>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding:"56px 40px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, borderBottom:`1px solid ${C.border}` }}>
        <Reveal>
          <div style={{ fontSize:12, letterSpacing:2, textTransform:"uppercase", color:C.muted, marginBottom:12 }}>Visit</div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:30, fontWeight:700, marginBottom:28 }}>{clinic.name}</h2>
          {[
            ["Address", clinic.address||`${clinic.city}, Tamil Nadu`],
            ["Phone",   clinic.phone],
            ["Email",   clinic.email],
          ].filter(([,v])=>v).map(([label,value])=>(
            <div key={label} style={{ display:"flex", gap:16, marginBottom:16, borderBottom:`1px solid ${C.border}`, paddingBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, width:80, flexShrink:0 }}>{label}</div>
              <div style={{ fontSize:14 }}>{value}</div>
            </div>
          ))}
        </Reveal>
        <Reveal delay={0.15}>
          <div style={{ border:`1px solid ${C.border}`, padding:26 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Hours</div>
            {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
              <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                <span style={{ color:C.muted }}>{d}</span>
                <span style={{ fontWeight:700, color: o?"#2e7d32":"#c0392b" }}>{h}</span>
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, background:"#25d366", color:"#fff", padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                WhatsApp
              </a>
              <a href={`tel:${clinic.phone}`}
                style={{ flex:1, background:C.text, color:"#fff", padding:"12px", textAlign:"center", fontSize:13, fontWeight:700, textDecoration:"none" }}>
                Call Now
              </a>
            </div>
            <div style={{ marginTop:14, textAlign:"center" }}>
              <a href={`/${clinic.slug}/privacy-policy`} style={{ fontSize:11, color:C.muted, textDecoration:"none" }}>Privacy Policy (DPDP Act, 2023)</a>
            </div>
          </div>
        </Reveal>
      </section>

      <div style={{ display:"flex", justifyContent:"space-between", padding:"22px 40px", borderTop:`2px solid ${C.text}`,
        fontSize:11, textTransform:"uppercase", letterSpacing:1 }}>
        <span>{clinic.name} © {new Date().getFullYear()}</span>
        <span>{clinic.city || ""}, Tamil Nadu</span>
      </div>

      <ClinicFooter clinic={clinic} doctor={doctor} hours={hours}/>

      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
          style={{ width:50, height:50, borderRadius:"50%", background:"#25d366",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(37,211,102,0.4)" }}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:C.text,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(0,0,0,0.3)" }}>📞</a>
      </div>
    </div>
  );
}
