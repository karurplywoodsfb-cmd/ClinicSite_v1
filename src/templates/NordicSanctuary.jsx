// src/templates/NordicSanctuary.jsx
// Clean Scandinavian minimalism — warm white, sage green, soft typography
// Accepts: clinic, services, doctors, media, onBookClick

import { useState, useEffect, useRef } from "react";
import BookingEngine      from "../components/BookingEngine";
import ClinicFooter          from "../components/ClinicFooter";
import WorkingHoursDisplay   from "../components/WorkingHoursDisplay";
import ClinicMediaSection from "../components/ClinicMediaSection";
import { useIsMobile }     from "../hooks/useIsMobile";

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis?1:0, transform: vis?"none":"translateY(18px)", transition:`opacity .6s ${delay}s ease, transform .6s ${delay}s ease` }}>
      {children}
    </div>
  );
}

export default function NordicSanctuary({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const doctor = doctors[0];
  const isMobile = useIsMobile();
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => { if (onBookClick) onBookClick(); else setShowBook(true); };
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);

  const C = {
    bg: "#f7f5f2",
    white: "#ffffff",
    surface: "#eeebe6",
    accent: "#4a7c59",
    accentLight: "#6fa87b",
    text: "#2a2a2a",
    muted: "#7a7570",
    border: "#ddd9d4",
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:C.bg, color:C.text, overflowX:"hidden" }}>

      {showBook && (
        <div onClick={e=>e.target===e.currentTarget&&setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(42,42,42,0.6)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={()=>setShowBook(false)} style={{ position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:C.white, border:"none", cursor:"pointer", fontSize:16 }}>✕</button>
            <BookingEngine hours={hours} branches={branches} clinic={clinic} services={activeServices}/>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background: scrolled ? "rgba(247,245,242,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        transition:"all .3s", padding:"0 24px", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt={clinic.name}
                  style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
              : <div style={{ width:36, height:36, borderRadius:8,
                  background:`linear-gradient(135deg,${C.accent||"#1565c0"},${C.accentLight||C.accent||"#1e88e5"})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"white", fontSize:15, fontWeight:700 }}>
                  {(clinic.name||"C").charAt(0).toUpperCase()}
                </div>
            }
          </div>
          <div style={{ fontSize:15, fontWeight:500, color:C.text }}>{clinic.name}</div>
        </div>
        <div style={{ display:"flex", gap:28, alignItems:"center" }}>
          {!isMobile && (
            [["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]].map(([l,h])=>(
            <a key={l} href={h} style={{ textDecoration:"none", color:C.muted, fontSize:13, transition:"color .15s" }}
              onMouseEnter={e=>e.target.style.color=C.accent}
              onMouseLeave={e=>e.target.style.color=C.muted}>{l}</a>
          ))
          )}
          <button onClick={handleBook} style={{
            background:C.accent, color:C.white, border:"none", borderRadius:6, padding:"9px 20px",
            fontSize:13, fontWeight:500, cursor:"pointer" }}>
            Book Appointment
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight:"100vh", paddingTop:64,
        background:`linear-gradient(170deg, ${C.white} 0%, ${C.bg} 60%)`,
        display:"flex", alignItems:"center", padding:"80px 24px",
      }}>
        <div style={{ width:"100%", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap:80, alignItems:"center", width:"100%" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8,
              background:`rgba(74,124,89,0.1)`, borderRadius:4, padding:"5px 14px",
              fontSize:11, color:C.accent, fontWeight:600, letterSpacing:1.5,
              textTransform:"uppercase", marginBottom:32 }}>
              {clinic.specialty} · {clinic.city}
            </div>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(40px,5vw,64px)",
              fontWeight:400, color:C.text, lineHeight:1.1, marginBottom:24 }}>
              {clinic.heroTagline || (<>Care that feels<br/><em style={{ color:C.accent }}>natural.</em></>)}
            </h1>
            <p style={{ fontSize:16, color:C.muted, lineHeight:1.85, marginBottom:40, maxWidth:460, fontWeight:300 }}>
              {clinic.about || `${clinic.name} provides gentle, specialist ${(clinic.specialty||"").toLowerCase()} care in ${clinic.city}.`}
            </p>
            <div style={{ display:"flex", gap:14 }}>
              <button onClick={handleBook} style={{
                background:C.accent, color:C.white, border:"none", borderRadius:8, padding:"14px 32px",
                fontSize:15, fontWeight:500, cursor:"pointer" }}>
                📅 Book Appointment
              </button>
              <a href={`tel:${clinic.phone}`}
                style={{ background:"transparent", color:C.accent, border:`1.5px solid ${C.accent}`,
                  borderRadius:8, padding:"13px 24px", fontSize:15, textDecoration:"none", fontWeight:500 }}>
                📞 Call
              </a>
            </div>
          </div>
          {/* Clean booking card */}
          <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, overflow:"hidden",
            boxShadow:"0 20px 60px rgba(42,42,42,0.08)" }}>
            <div style={{ background:C.accent, padding:"24px 28px" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:C.white, fontWeight:400, marginBottom:4 }}>Book an Appointment</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>Gentle care, at your pace</div>
            </div>
            <div style={{ padding:24 }}>
              {[["Full Name","Your name"],["Phone","98400 00000"]].map(([l,p])=>(
                <div key={l} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>{l}</div>
                  <input placeholder={p} style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`,
                    borderRadius:6, padding:"10px 12px", fontSize:14, color:C.text, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <button onClick={handleBook} style={{
                width:"100%", background:C.accent, color:C.white, border:"none",
                borderRadius:7, padding:"13px", fontSize:14, fontWeight:500, cursor:"pointer", marginTop:4 }}>
                See Available Times →
              </button>
              <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:10 }}>🔒 DPDP Act, 2023 compliant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"80px 24px", background:C.white }}>
          <div style={{ width:"100%" }}>
            <Reveal>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Services</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,3vw,42px)", fontWeight:400, color:C.text, marginBottom:48 }}>How We Help</h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:20 }}>
              {activeServices.map((svc,i)=>(
                <Reveal key={svc.id||i} delay={i*0.05}>
                  <div style={{ background:C.bg, borderRadius:14, padding:"24px 20px", border:`1px solid ${C.border}`, transition:"all .25s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.transform="translateY(-3px)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="none"}}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{svc.icon||"🌿"}</div>
                    <div style={{ fontSize:14, fontWeight:500, color:C.text, marginBottom:6 }}>{svc.name}</div>
                    {svc.description && <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{svc.description}</div>}
                    {svc.price && !svc.hide_price && <div style={{ fontSize:12, fontWeight:500, color:C.accent, marginTop:10 }}>Fee: {svc.price}</div>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Doctor */}
      {doctor && (
        <section id="doctor" style={{ padding:"80px 24px", background:C.bg }}>
          <div style={{ width:"100%", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.4fr", gap:60, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:20, background:C.surface,
                border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {doctor.photo_url ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:100 }}>👩‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Your Doctor</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:400, color:C.text, marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:C.accent, fontWeight:500, fontSize:15, marginBottom:6 }}>{doctor.degree}</div>
              {doctor.reg_number && <div style={{ fontSize:11, color:C.muted, marginBottom:20, fontFamily:"monospace" }}>Reg No: {doctor.reg_number}{doctor.council_name?` — ${doctor.council_name}`:""}</div>}
              {doctor.bio && <p style={{ color:C.muted, lineHeight:1.85, fontSize:15, marginBottom:28, fontWeight:300 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{ background:C.accent, color:C.white, border:"none", borderRadius:8, padding:"14px 28px", fontSize:15, fontWeight:500, cursor:"pointer" }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* Contact */}
      <section id="contact" style={{ padding:"80px 24px", background:C.white }}>
        <div style={{ width:"100%", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:60 }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Find Us</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:400, color:C.text, marginBottom:32 }}>Visit {clinic.name}</h2>
            {[["📍","Address",clinic.address||`${clinic.city}, Tamil Nadu`],["📞","Phone",clinic.phone],["✉️","Email",clinic.email]]
              .filter(([,,v])=>v).map(([icon,label,value])=>(
              <div key={label} style={{ display:"flex", gap:16, marginBottom:20, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:C.bg, border:`1px solid ${C.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:14, color:C.text }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:C.bg, borderRadius:14, padding:28, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                  <span style={{ color:C.muted }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?C.accent:"#ef4444" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"white", borderRadius:8, padding:"12px", textAlign:"center", fontSize:13, fontWeight:500, textDecoration:"none" }}>💬 WhatsApp</a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:C.accent, color:C.white, borderRadius:8, padding:"12px", textAlign:"center", fontSize:13, fontWeight:500, textDecoration:"none" }}>📞 Call Now</a>
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
          style={{ width:50, height:50, borderRadius:"50%", background:"#25d366", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none", boxShadow:"0 4px 16px rgba(37,211,102,0.4)", transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none", boxShadow:`0 4px 16px rgba(74,124,89,0.4)`, transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>📞</a>
      </div>
    </div>
  );
}
