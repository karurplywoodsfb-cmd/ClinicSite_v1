// src/templates/LinenSage.jsx
// Minimalist premium — soft linen base, deep muted sage accent, quiet spa-like calm
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

export default function LinenSage({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else setShowBook(true);
  };

  const C = {
    bg:      "#f6f5ef",
    surface: "#ffffff",
    text:    "#262e22",
    muted:   "#7d8574",
    border:  "#e2e2d3",
    accent:  "#4a5a45",
    accent2: "#7c8f6e",
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.text, overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300,
            background:"rgba(38,46,34,0.6)", backdropFilter:"blur(6px)",
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
      <nav style={{ display:"flex", justifyContent:"center", padding:"26px 48px" }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:19, color:C.accent, letterSpacing:1 }}>{clinic.name}</div>
      </nav>
      <div style={{ display:"flex", justifyContent:"center", gap:30, paddingBottom:20, borderBottom:`1px solid ${C.border}` }}>
        {[["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]].map(([l,h]) => (
          <a key={l} href={h} style={{ textDecoration:"none", color:C.muted, fontSize:12, letterSpacing:1, textTransform:"uppercase" }}>{l}</a>
        ))}
      </div>

      {/* ── Hero ── */}
      <section style={{ padding:"70px 48px", textAlign:"center" }}>
        <Reveal>
          <div style={{ fontSize:11, letterSpacing:2.5, textTransform:"uppercase", color:C.accent2, marginBottom:22 }}>
            {clinic.specialty || "A calmer kind of care"}
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(30px,4.5vw,48px)",
            color:C.text, lineHeight:1.2, maxWidth:680, margin:"0 auto 24px" }}>
            {clinic.heroTagline || "Room to breathe, time to heal."}
          </h1>
          <p style={{ fontSize:15, color:C.muted, lineHeight:1.8, maxWidth:460, margin:"0 auto 32px" }}>
            {clinic.about || `${clinic.name} was built around unhurried appointments and a calm space to recover in.`}
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:12 }}>
            <button onClick={handleBook} style={{
              background:C.accent, color:"#fff", border:"none", borderRadius:4,
              padding:"14px 30px", fontSize:13, letterSpacing:0.5, fontWeight:600, cursor:"pointer" }}>
              Book an appointment
            </button>
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} style={{
                border:`1px solid ${C.border}`, color:C.text, borderRadius:4,
                padding:"14px 26px", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                Call the clinic
              </a>
            )}
          </div>
        </Reveal>
      </section>

      {/* ── Services ── */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"0 48px 70px" }}>
          <div style={{ maxWidth:960, margin:"0 auto", display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 }}>
            {activeServices.map((svc, i) => (
              <Reveal key={svc.id||i} delay={i*0.05}>
                <div style={{ background:C.surface, borderRadius:12, padding:24, textAlign:"center", border:`1px solid ${C.border}` }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:C.bg, margin:"0 auto 14px",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{svc.icon||"🌿"}</div>
                  <h4 style={{ fontSize:14, color:C.text, marginBottom:8, fontWeight:600 }}>{svc.name}</h4>
                  {svc.description && <p style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{svc.description}</p>}
                  {svc.price && !svc.hide_price && <div style={{ fontSize:12, color:C.accent, marginTop:10, fontWeight:600 }}>{svc.price}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Doctor ── */}
      {doctor && (
        <section id="doctor" style={{ padding:"70px 48px", background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"0.8fr 1.2fr", gap:56, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"1/1", borderRadius:"50%", background:C.bg,
                display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", border:`1px solid ${C.border}` }}>
                {doctor.photo_url
                  ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:70 }}>🧑‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.accent2, marginBottom:12 }}>Your doctor</div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:C.text, marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:C.accent2, fontWeight:600, fontSize:14, marginBottom:8 }}>{doctor.degree}</div>
              {doctor.reg_number && (
                <div style={{ fontSize:11, color:C.muted, marginBottom:18, fontFamily:"monospace" }}>
                  Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}
                </div>
              )}
              {doctor.bio && <p style={{ color:C.muted, lineHeight:1.8, fontSize:14, marginBottom:26 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background:C.accent, color:"#fff", border:"none", borderRadius:4,
                padding:"13px 26px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Book a consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding:"70px 48px" }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:56 }}>
          <Reveal>
            <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.accent2, marginBottom:12 }}>Find us</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:C.text, marginBottom:28 }}>Visit {clinic.name}</h2>
            {[
              ["📍","Address", clinic.address||`${clinic.city}, Tamil Nadu`],
              ["📞","Phone",   clinic.phone],
              ["✉️","Email",   clinic.email],
            ].filter(([,,v])=>v).map(([icon,label,value])=>(
              <div key={label} style={{ display:"flex", gap:14, marginBottom:18, alignItems:"flex-start" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:C.surface,
                  border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:C.accent2, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:14, color:C.text }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:C.surface, borderRadius:12, padding:26, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                  <span style={{ color:C.muted }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?"#3b5c3f":"#8a3c34" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:22 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"#fff", borderRadius:4, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  WhatsApp
                </a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:C.accent, color:"#fff", borderRadius:4, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  Call Now
                </a>
              </div>
              <div style={{ marginTop:16, textAlign:"center" }}>
                <a href={`/${clinic.slug}/privacy-policy`} style={{ fontSize:11, color:C.muted, textDecoration:"none" }}>Privacy Policy (DPDP Act, 2023)</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <ClinicFooter clinic={clinic} doctor={doctor} hours={hours}/>

      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
          style={{ width:48, height:48, borderRadius:"50%", background:"#25d366",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(37,211,102,0.4)" }}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:48, height:48, borderRadius:"50%", background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(74,90,69,0.4)" }}>📞</a>
      </div>
    </div>
  );
}
