// src/templates/PorcelainNavy.jsx
// Minimalist premium — crisp porcelain white, deep ink-navy accent, classic medical-premium
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
      transition: `opacity .6s ${delay}s ease, transform .6s ${delay}s ease`,
    }}>
      {children}
    </div>
  );
}

export default function PorcelainNavy({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else setShowBook(true);
  };

  const C = {
    bg:      "#fafbfc",
    surface: "#ffffff",
    text:    "#12181f",
    muted:   "#6e7a87",
    border:  "#e4e8ec",
    accent:  "#1e2a3a",
    accent2: "#4a5f7a",
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.text, overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300,
            background:"rgba(18,24,31,0.65)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={() => setShowBook(false)} style={{
              position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:"#fff",
              border:"none", cursor:"pointer", fontSize:16 }}>✕</button>
            <BookingEngine hours={hours} branches={branches} clinic={clinic} services={activeServices} doctors={doctors}/>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"22px 48px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:6, background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, fontWeight:700 }}>
            {(clinic.name||"C").charAt(0).toUpperCase()}
          </div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:19, color:C.text }}>{clinic.name}</div>
        </div>
        <div style={{ display:"flex", gap:30, alignItems:"center" }}>
          {[["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]].map(([l,h]) => (
            <a key={l} href={h} style={{ textDecoration:"none", color:C.muted, fontSize:13, fontWeight:500 }}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background:C.accent, color:"#fff", border:"none", borderRadius:6,
            padding:"11px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Book Appointment
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding:"70px 48px", display:"grid", gridTemplateColumns:"1.1fr 0.9fr", gap:60, alignItems:"center" }}>
        <Reveal>
          <div style={{ display:"inline-block", border:`1px solid ${C.border}`, borderRadius:4, padding:"6px 14px",
            fontSize:11, fontWeight:600, color:C.accent2, letterSpacing:1.5, textTransform:"uppercase", marginBottom:24 }}>
            {clinic.specialty ? `${clinic.specialty} · ${clinic.city||""}` : "Established Practice"}
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(32px,4.2vw,48px)",
            color:C.text, lineHeight:1.2, marginBottom:22 }}>
            {clinic.heroTagline || "Clarity in every diagnosis."}
          </h1>
          <p style={{ fontSize:15, color:C.muted, lineHeight:1.75, maxWidth:440, marginBottom:32 }}>
            {clinic.about || `${clinic.name} delivers precise, unhurried care in ${clinic.city || "your city"}.`}
          </p>
          <div style={{ display:"flex", gap:14 }}>
            <button onClick={handleBook} style={{
              background:C.accent, color:"#fff", border:"none", borderRadius:6,
              padding:"14px 28px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Book an appointment
            </button>
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} style={{
                border:`1px solid ${C.border}`, color:C.text, borderRadius:6,
                padding:"14px 24px", fontSize:14, fontWeight:600, textDecoration:"none" }}>
                Call the clinic
              </a>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:10, background:C.surface,
            border:`1px solid ${C.border}`, overflow:"hidden" }}>
            {doctor?.photo_url && <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
          </div>
        </Reveal>
      </section>

      {/* ── Services ── */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"50px 48px", background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.accent2, marginBottom:10 }}>Our Services</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, color:C.text, marginBottom:36 }}>Clinical Services</h2>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
            {activeServices.map((svc, i) => (
              <Reveal key={svc.id||i} delay={i*0.05}>
                <div style={{ background:C.bg, borderRadius:8, padding:"22px 20px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:24, marginBottom:12 }}>{svc.icon||"🩺"}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:6 }}>{svc.name}</div>
                  {svc.description && <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{svc.description}</div>}
                  {svc.price && !svc.hide_price && <div style={{ fontSize:12, fontWeight:600, color:C.accent2, marginTop:10 }}>Fee: {svc.price}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Doctor ── */}
      {doctor && (
        <section id="doctor" style={{ padding:"70px 48px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:56, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:10, background:C.surface,
                border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {doctor.photo_url
                  ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:80 }}>🧑‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.accent2, marginBottom:10 }}>Your Doctor</div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, color:C.text, marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:C.accent2, fontWeight:600, fontSize:14, marginBottom:8 }}>{doctor.degree}</div>
              {doctor.reg_number && (
                <div style={{ fontSize:11, color:C.muted, marginBottom:18, fontFamily:"monospace" }}>
                  Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}
                </div>
              )}
              {doctor.bio && <p style={{ color:C.muted, lineHeight:1.8, fontSize:15, marginBottom:26 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background:C.accent, color:"#fff", border:"none", borderRadius:6,
                padding:"13px 26px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding:"70px 48px", background:C.surface, borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:56 }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.accent2, marginBottom:10 }}>Find Us</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:C.text, marginBottom:28 }}>Visit {clinic.name}</h2>
            {[
              ["📍","Address", clinic.address||`${clinic.city}, Tamil Nadu`],
              ["📞","Phone",   clinic.phone],
              ["✉️","Email",   clinic.email],
            ].filter(([,,v])=>v).map(([icon,label,value])=>(
              <div key={label} style={{ display:"flex", gap:14, marginBottom:18, alignItems:"flex-start" }}>
                <div style={{ width:38, height:38, borderRadius:8, background:C.bg,
                  border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:C.accent2, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:14, color:C.text }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:C.bg, borderRadius:10, padding:26, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                  <span style={{ color:C.muted }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?"#2e6b3a":"#b0413a" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:22 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"#fff", borderRadius:6, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  💬 WhatsApp
                </a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:C.accent, color:"#fff", borderRadius:6, padding:"12px", textAlign:"center", fontSize:13, fontWeight:700, textDecoration:"none" }}>
                  📞 Call Now
                </a>
              </div>
              <div style={{ marginTop:14, textAlign:"center" }}>
                <a href={`/${clinic.slug}/privacy-policy`} style={{ fontSize:11, color:C.muted, textDecoration:"none" }}>Privacy Policy (DPDP Act, 2023)</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <ClinicFooter clinic={clinic} doctor={doctor} hours={hours}/>

      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
          style={{ width:50, height:50, borderRadius:"50%", background:"#25d366",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(37,211,102,0.4)" }}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(30,42,58,0.4)" }}>📞</a>
      </div>
    </div>
  );
}
