// src/templates/SoftStructure.jsx
// Friendly, modern, SaaS-clean — light lavender base, deep violet accent, rounded cards
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
      transform: vis ? "none" : "translateY(18px)",
      transition: `opacity .5s ${delay}s ease, transform .5s ${delay}s ease`,
    }}>
      {children}
    </div>
  );
}

export default function SoftStructure({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else setShowBook(true);
  };

  const C = {
    bg:      "#f2f0fa",
    surface: "#ffffff",
    accent:  "#6947e8",
    dark:    "#2e2452",
    text:    "#211a3d",
    muted:   "#736c8f",
    border:  "#e4dffa",
    cardBg:  "#ece7fc",
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:C.bg, color:C.text, overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300,
            background:"rgba(46,36,82,0.65)", backdropFilter:"blur(6px)",
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
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 40px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:19, color:C.dark }}>
          <span style={{ width:10, height:10, borderRadius:3, background:C.accent, display:"inline-block" }}/>
          {clinic.name}
        </div>
        <div style={{ display:"flex", gap:26, alignItems:"center" }}>
          {[["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]].map(([l,h]) => (
            <a key={l} href={h} style={{ textDecoration:"none", color:C.muted, fontSize:13, fontWeight:500 }}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background:C.dark, color:"#fff", border:"none", borderRadius:10,
            padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Book Now
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign:"center", padding:"50px 40px 30px" }}>
        <Reveal>
          <div style={{ display:"inline-block", background:"#fff", color:C.accent, fontSize:12, fontWeight:600,
            padding:"6px 16px", borderRadius:20, marginBottom:20 }}>
            {clinic.specialty ? `${clinic.specialty} · ${clinic.city||""}` : "Trusted care, made simple"}
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"clamp(30px,4vw,44px)", fontWeight:700,
            color:C.dark, lineHeight:1.15, maxWidth:680, margin:"0 auto 16px" }}>
            {clinic.heroTagline || "Everything your clinic visit should be — simple."}
          </h1>
          <p style={{ fontSize:15, color:C.muted, maxWidth:480, margin:"0 auto 26px", lineHeight:1.7 }}>
            {clinic.about || `Book online, see the right doctor at ${clinic.name}, and get a plan you can actually follow.`}
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <button onClick={handleBook} style={{
              background:C.accent, color:"#fff", border:"none", borderRadius:10,
              padding:"13px 26px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Book an appointment
            </button>
            <a href="#services" style={{
              background:"#fff", color:C.dark, borderRadius:10,
              padding:"13px 26px", fontSize:14, fontWeight:600, textDecoration:"none" }}>
              View services
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── Services ── */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"40px 40px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:18 }}>
            {activeServices.map((svc, i) => (
              <Reveal key={svc.id||i} delay={i*0.05}>
                <div style={{ background:C.surface, borderRadius:18, padding:24, border:`1px solid ${C.border}` }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:C.cardBg, color:C.accent,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:14 }}>◆</div>
                  <h4 style={{ fontSize:15, color:C.dark, marginBottom:8, fontWeight:600 }}>{svc.name}</h4>
                  {svc.description && <p style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{svc.description}</p>}
                  {svc.price && !svc.hide_price && <div style={{ fontSize:12, fontWeight:700, color:C.accent, marginTop:10 }}>{svc.price}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Doctor ── */}
      {doctor && (
        <section id="doctor" style={{ padding:"40px 40px" }}>
          <div style={{ background:C.surface, borderRadius:24, padding:40, display:"grid",
            gridTemplateColumns:"1fr 1.4fr", gap:44, alignItems:"center", border:`1px solid ${C.border}` }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"1/1", borderRadius:20, background:C.cardBg,
                display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {doctor.photo_url
                  ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:70 }}>🧑‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize:12, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Your doctor</div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:28, fontWeight:700, color:C.dark, marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:C.accent, fontWeight:600, fontSize:14, marginBottom:8 }}>{doctor.degree}</div>
              {doctor.reg_number && (
                <div style={{ fontSize:11, color:C.muted, marginBottom:16, fontFamily:"monospace" }}>
                  Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}
                </div>
              )}
              {doctor.bio && <p style={{ color:C.muted, lineHeight:1.7, fontSize:14, marginBottom:22 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background:C.accent, color:"#fff", border:"none", borderRadius:10,
                padding:"12px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Book a consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding:"40px 40px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Reveal>
            <div style={{ background:C.surface, borderRadius:20, padding:28, border:`1px solid ${C.border}`, height:"100%" }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Find us</div>
              {[
                ["📍","Address", clinic.address||`${clinic.city}, Tamil Nadu`],
                ["📞","Phone",   clinic.phone],
                ["✉️","Email",   clinic.email],
              ].filter(([,,v])=>v).map(([icon,label,value])=>(
                <div key={label} style={{ display:"flex", gap:14, marginBottom:16, alignItems:"flex-start" }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:C.cardBg,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:10, color:C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:14, color:C.dark }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:C.surface, borderRadius:20, padding:28, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                  <span style={{ color:C.muted }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?"#2e7d32":"#c0392b" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"#fff", borderRadius:10, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  💬 WhatsApp
                </a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:C.accent, color:"#fff", borderRadius:10, padding:"12px", textAlign:"center", fontSize:13, fontWeight:700, textDecoration:"none" }}>
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

      {/* ── Bottom CTA banner ── */}
      <div style={{ background:C.dark, margin:"0 40px 40px", borderRadius:20, padding:"30px 40px",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ color:"#fff", fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700 }}>Ready when you are.</div>
          <div style={{ color:"#b8adf0", fontSize:13, marginTop:4 }}>Same-day slots usually available.</div>
        </div>
        <button onClick={handleBook} style={{
          background:"#fff", color:C.dark, border:"none", borderRadius:10,
          padding:"12px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          Book an appointment
        </button>
      </div>

      <ClinicFooter clinic={clinic} doctor={doctor} hours={hours}/>

      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
          style={{ width:50, height:50, borderRadius:"50%", background:"#25d366",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(37,211,102,0.4)" }}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:`0 4px 16px rgba(105,71,232,0.4)` }}>📞</a>
      </div>
    </div>
  );
}
