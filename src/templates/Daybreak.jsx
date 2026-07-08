// src/templates/Daybreak.jsx
// Warm, approachable, general-purpose — cream + terracotta, rounded organic shapes
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
      transform: vis ? "none" : "translateY(20px)",
      transition: `opacity .5s ${delay}s ease, transform .5s ${delay}s ease`,
    }}>
      {children}
    </div>
  );
}

export default function Daybreak({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else setShowBook(true);
  };

  const C = {
    bg:       "#fbf6ef",
    surface:  "#ffffff",
    accent:   "#e8674a",
    accentLt: "#f4a688",
    text:     "#2b2621",
    muted:    "#6b6259",
    border:   "#efe3d6",
    blob:     "#f4d8c9",
    dark:     "#2b2621",
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.text, overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300,
            background:"rgba(43,38,33,0.6)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={() => setShowBook(false)} style={{
              position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:C.surface,
              border:"none", cursor:"pointer", fontSize:16 }}>✕</button>
            <BookingEngine hours={hours} branches={branches} clinic={clinic} services={activeServices} doctors={doctors}/>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav style={{
        position:"sticky", top:0, zIndex:100, background:C.bg,
        padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between",
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, overflow:"hidden", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            background: clinic.logo_url ? "transparent" : `linear-gradient(135deg,${C.accent},${C.accentLt})` }}>
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt={clinic.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
              : <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>{(clinic.name||"C").charAt(0).toUpperCase()}</span>}
          </div>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:19, color:C.dark }}>{clinic.name}</div>
        </div>
        <div style={{ display:"flex", gap:26, alignItems:"center" }}>
          {[["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]].map(([l,h]) => (
            <a key={l} href={h} style={{ textDecoration:"none", color:C.muted, fontSize:13, fontWeight:500 }}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background:C.accent, color:"#fff", border:"none", borderRadius:30,
            padding:"10px 22px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Book Visit
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position:"relative", padding:"60px 24px 70px", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:420, height:420, borderRadius:"50% 50% 45% 55% / 55% 45% 55% 45%",
          background:C.blob, right:"-60px", top:"-100px", opacity:0.6, zIndex:0 }}/>
        <div style={{ width:"100%", maxWidth:1100, margin:"0 auto", display:"grid",
          gridTemplateColumns:"1.1fr 0.9fr", gap:50, alignItems:"center", position:"relative", zIndex:1 }}>
          <Reveal>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.accent, marginBottom:16 }}>
              {clinic.specialty ? `${clinic.specialty} · ` : ""}Now accepting new patients
            </div>
            <h1 style={{ fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:"clamp(34px,4.5vw,52px)", lineHeight:1.1, color:C.dark, marginBottom:20 }}>
              {clinic.heroTagline || "Care that feels like coming home"}
            </h1>
            <p style={{ fontSize:15, color:C.muted, lineHeight:1.7, maxWidth:440, marginBottom:28 }}>
              {clinic.about || `${clinic.name} welcomes you with same-day appointments and a team that remembers your name.`}
            </p>
            <div style={{ display:"flex", gap:16, alignItems:"center" }}>
              <button onClick={handleBook} style={{
                background:C.dark, color:"#fff", border:"none", borderRadius:30,
                padding:"14px 28px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Book an appointment
              </button>
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`} style={{ color:C.dark, fontSize:14, fontWeight:600, textDecoration:"underline" }}>
                  Call the clinic
                </a>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:"#e3c9b5", borderRadius:24, height:340, position:"relative", overflow:"hidden" }}>
              {doctor?.photo_url && <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
              <div style={{ position:"absolute", bottom:20, left:20, background:"#fff", borderRadius:14,
                padding:"12px 16px", boxShadow:"0 8px 20px rgba(0,0,0,0.12)" }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:C.accent, fontWeight:600 }}>
                  {clinic.years_experience ? `${clinic.years_experience}+ yrs` : "Trusted"}
                </div>
                <div style={{ fontSize:12, color:C.dark }}>in {clinic.city || "your community"}</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Services ── */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"60px 24px" }}>
          <div style={{ width:"100%", maxWidth:1100, margin:"0 auto" }}>
            <Reveal>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>What we offer</div>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:"clamp(26px,3vw,36px)", color:C.dark, marginBottom:36 }}>Our Services</h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:18 }}>
              {activeServices.map((svc, i) => (
                <Reveal key={svc.id||i} delay={i*0.05}>
                  <div style={{ background:C.surface, borderRadius:16, padding:22 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"#fbe4d8",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:14 }}>{svc.icon||"🩺"}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:6 }}>{svc.name}</div>
                    {svc.description && <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{svc.description}</div>}
                    {svc.price && !svc.hide_price && <div style={{ fontSize:12, fontWeight:700, color:C.accent, marginTop:10 }}>Fee: {svc.price}</div>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Doctor ── */}
      {doctor && (
        <section id="doctor" style={{ padding:"60px 24px", background:C.surface }}>
          <div style={{ width:"100%", maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:56, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:20, background:C.blob,
                display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {doctor.photo_url
                  ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:90 }}>🧑‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Meet your doctor</div>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:32, color:C.dark, marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:C.accent, fontWeight:600, fontSize:15, marginBottom:6 }}>{doctor.degree}</div>
              {doctor.reg_number && (
                <div style={{ fontSize:11, color:C.muted, marginBottom:18, fontFamily:"monospace" }}>
                  Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}
                </div>
              )}
              {doctor.bio && <p style={{ color:C.muted, lineHeight:1.8, fontSize:15, marginBottom:26 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background:C.accent, color:"#fff", border:"none", borderRadius:30,
                padding:"14px 28px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding:"60px 24px" }}>
        <div style={{ width:"100%", maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:56 }}>
          <Reveal>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Find us</div>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:30, color:C.dark, marginBottom:28 }}>Visit {clinic.name}</h2>
            {[
              ["📍","Address", clinic.address||`${clinic.city}, Tamil Nadu`],
              ["📞","Phone",   clinic.phone],
              ["✉️","Email",   clinic.email],
            ].filter(([,,v])=>v).map(([icon,label,value])=>(
              <div key={label} style={{ display:"flex", gap:14, marginBottom:18, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:12, background:C.surface,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:14, color:C.dark }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:C.surface, borderRadius:20, padding:26 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                  <span style={{ color:C.muted }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?"#2e7d32":"#c0392b" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:22 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"#fff", borderRadius:30, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  💬 WhatsApp
                </a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:C.accent, color:"#fff", borderRadius:30, padding:"12px", textAlign:"center", fontSize:13, fontWeight:700, textDecoration:"none" }}>
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
            boxShadow:`0 4px 16px rgba(232,103,74,0.4)` }}>📞</a>
      </div>
    </div>
  );
}
