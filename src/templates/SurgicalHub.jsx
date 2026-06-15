// src/templates/SurgicalHub.jsx
// Bold surgical precision — stark white, deep red accent, clinical authority
// Accepts: clinic, services, doctors, media, onBookClick

import { useState, useEffect, useRef } from "react";
import BookingEngine      from "../components/BookingEngine";
import ClinicFooter       from "../components/ClinicFooter";
import ClinicMediaSection from "../components/ClinicMediaSection";

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity:vis?1:0, transform:vis?"none":"translateY(16px)", transition:`opacity .5s ${delay}s ease, transform .5s ${delay}s ease` }}>
      {children}
    </div>
  );
}

export default function SurgicalHub({ clinic, services = [], doctors = [], media = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => { if (onBookClick) onBookClick(); else setShowBook(true); };
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);

  const C = {
    bg: "#ffffff",
    surface: "#f5f6f8",
    accent: "#c0392b",
    accentDark: "#922b21",
    accentLight: "#e74c3c",
    text: "#1a1a2e",
    muted: "#6b7280",
    border: "#e5e7eb",
    dark: "#111827",
  };

  return (
    <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", background:C.bg, color:C.text, overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet"/>

      {showBook && (
        <div onClick={e=>e.target===e.currentTarget&&setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(17,24,39,0.75)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={()=>setShowBook(false)} style={{ position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:C.bg, border:"none", cursor:"pointer", fontSize:16 }}>✕</button>
            <BookingEngine clinic={clinic} services={activeServices}/>
          </div>
        </div>
      )}

      {/* Navbar — stark, authoritative */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background: scrolled ? "rgba(255,255,255,0.97)" : C.bg,
        borderBottom: `2px solid ${scrolled ? C.accent : C.border}`,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition:"all .3s", padding:"0 48px", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏥</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.dark, letterSpacing:.3 }}>{clinic.name}</div>
            {clinic.specialty && <div style={{ fontSize:10, color:C.accent, letterSpacing:1.5, textTransform:"uppercase", fontWeight:600 }}>{clinic.specialty}</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:28, alignItems:"center" }}>
          {[["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]].map(([l,h])=>(
            <a key={l} href={h} style={{ textDecoration:"none", color:C.muted, fontSize:13, fontWeight:500, transition:"color .15s" }}
              onMouseEnter={e=>e.target.style.color=C.accent}
              onMouseLeave={e=>e.target.style.color=C.muted}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background:C.accent, color:C.bg, border:"none", padding:"9px 22px",
            fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:.5, textTransform:"uppercase" }}>
            Book Appointment
          </button>
        </div>
      </nav>

      {/* Hero — two-tone split layout */}
      <section style={{
        minHeight:"100vh", paddingTop:64,
        display:"flex", alignItems:"stretch",
      }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1.1fr 1fr", width:"100%", alignItems:"center", padding:"0 48px" }}>
          <div style={{ padding:"80px 0" }}>
            {/* Red accent bar */}
            <div style={{ width:48, height:4, background:C.accent, marginBottom:28 }}/>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:C.muted, marginBottom:16 }}>
              {clinic.specialty} · {clinic.city}
            </div>
            <h1 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:"clamp(36px,4.5vw,58px)",
              fontWeight:600, color:C.dark, lineHeight:1.1, marginBottom:24 }}>
              {clinic.heroTagline || (<>Precision Care.<br/><em style={{ color:C.accent }}>Expert Hands.</em></>)}
            </h1>
            <p style={{ fontSize:16, color:C.muted, lineHeight:1.8, marginBottom:40, maxWidth:460 }}>
              {clinic.about || `${clinic.name} provides specialist ${(clinic.specialty||"").toLowerCase()} care in ${clinic.city}, with a focus on clinical accuracy and patient safety.`}
            </p>
            <div style={{ display:"flex", gap:14, marginBottom:48 }}>
              <button onClick={handleBook} style={{
                background:C.accent, color:C.bg, border:"none", padding:"15px 32px",
                fontSize:15, fontWeight:700, cursor:"pointer", textTransform:"uppercase", letterSpacing:.8 }}>
                Book Appointment →
              </button>
              <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ background:"transparent", color:C.dark, border:`2px solid ${C.dark}`,
                  padding:"13px 24px", fontSize:15, textDecoration:"none", fontWeight:600 }}>
                💬 WhatsApp
              </a>
            </div>
            {/* Stats bar */}
            <div style={{ display:"flex", gap:0, borderTop:`2px solid ${C.border}`, paddingTop:28 }}>
              {[
                doctor?.experience && [doctor.experience, "Clinical Experience"],
                activeServices.length>0 && [`${activeServices.length}+`, "Services"],
                doctor?.reg_number && ["Registered", "Practitioner"],
              ].filter(Boolean).map(([n,l], i, arr)=>(
                <div key={l} style={{ flex:1, paddingRight:28, borderRight: i<arr.length-1 ? `1px solid ${C.border}` : "none", paddingLeft: i>0?28:0 }}>
                  <div style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:22, color:C.accent, fontWeight:600 }}>{n}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2, textTransform:"uppercase", letterSpacing:.8 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking panel — no border-radius, stark */}
          <div style={{ background:C.dark, alignSelf:"stretch", display:"flex", alignItems:"center", padding:"48px 40px" }}>
            <div style={{ width:"100%" }}>
              <div style={{ width:32, height:3, background:C.accent, marginBottom:20 }}/>
              <div style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:22, color:C.bg, fontWeight:600, marginBottom:4 }}>Request Appointment</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Confirmed within clinic hours</div>
              {[["Full Name","Your name"],["Phone","98400 00000"]].map(([l,p])=>(
                <div key={l} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, color:C.accent, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
                  <input placeholder={p} style={{ width:"100%", background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.1)", padding:"11px 12px",
                    fontSize:14, color:C.bg, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <button onClick={handleBook} style={{
                width:"100%", background:C.accent, color:C.bg, border:"none", padding:"14px",
                fontSize:14, fontWeight:700, cursor:"pointer", marginTop:8, textTransform:"uppercase", letterSpacing:.8 }}>
                Check Available Slots →
              </button>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textAlign:"center", marginTop:12 }}>🔒 DPDP Act, 2023 compliant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"80px 48px", background:C.surface }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <Reveal>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{ width:32, height:3, background:C.accent }}/>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:C.accent }}>Clinical Services</div>
              </div>
              <h2 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:"clamp(26px,3vw,38px)", fontWeight:600, color:C.dark, marginBottom:48 }}>What We Treat</h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:2 }}>
              {activeServices.map((svc,i)=>(
                <Reveal key={svc.id||i} delay={i*0.04}>
                  <div style={{ background:C.bg, padding:"24px 20px",
                    borderLeft:`3px solid transparent`, transition:"all .2s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderLeftColor=C.accent; e.currentTarget.style.background=C.bg; e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.06)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderLeftColor="transparent"; e.currentTarget.style.boxShadow="none"}}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{svc.icon||"🏥"}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.dark, marginBottom:6 }}>{svc.name}</div>
                    {svc.description && <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{svc.description}</div>}
                    {svc.price && !svc.hide_price && <div style={{ fontSize:12, fontWeight:700, color:C.accent, marginTop:10, textTransform:"uppercase", letterSpacing:.5 }}>Fee: {svc.price}</div>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Doctor */}
      {doctor && (
        <section id="doctor" style={{ padding:"80px 48px", background:C.bg }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:60, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5",
                background:C.surface, border:`2px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {doctor.photo_url ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:100 }}>👨‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:32, height:3, background:C.accent }}/>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:C.accent }}>Your Doctor</div>
              </div>
              <h2 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:36, fontWeight:600, color:C.dark, marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:C.accent, fontWeight:700, fontSize:15, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>{doctor.degree}</div>
              {doctor.reg_number && <div style={{ fontSize:11, color:C.muted, marginBottom:20, fontFamily:"monospace", background:C.surface, display:"inline-block", padding:"4px 10px" }}>Reg No: {doctor.reg_number}{doctor.council_name?` — ${doctor.council_name}`:""}</div>}
              {doctor.bio && <p style={{ color:C.muted, lineHeight:1.8, fontSize:15, marginBottom:28, marginTop:16 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background:C.accent, color:C.bg, border:"none", padding:"14px 28px",
                fontSize:15, fontWeight:700, cursor:"pointer", textTransform:"uppercase", letterSpacing:.8 }}>
                Book a Consultation →
              </button>
            </Reveal>
          </div>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* Contact */}
      <section id="contact" style={{ padding:"80px 48px", background:C.dark }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60 }}>
          <Reveal>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <div style={{ width:32, height:3, background:C.accent }}/>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:C.accent }}>Contact</div>
            </div>
            <h2 style={{ fontFamily:"'IBM Plex Serif',serif", fontSize:34, fontWeight:600, color:C.bg, marginBottom:32 }}>Visit {clinic.name}</h2>
            {[["📍","Address",clinic.address||`${clinic.city}, Tamil Nadu`],["📞","Phone",clinic.phone],["✉️","Email",clinic.email]]
              .filter(([,,v])=>v).map(([icon,label,value])=>(
              <div key={label} style={{ display:"flex", gap:16, marginBottom:20, alignItems:"flex-start" }}>
                <div style={{ width:42, height:42, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,0.7)" }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:"rgba(255,255,255,0.04)", padding:28, border:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.bg, marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:13 }}>
                  <span style={{ color:"rgba(255,255,255,0.5)" }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?"#4ade80":"#f87171" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"white", padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>💬 WhatsApp</a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:C.accent, color:C.bg, padding:"12px", textAlign:"center", fontSize:13, fontWeight:700, textDecoration:"none" }}>📞 Call Now</a>
              </div>
              <div style={{ marginTop:14, textAlign:"center" }}>
                <a href={`/${clinic.slug}/privacy-policy`} style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textDecoration:"none" }}>Privacy Policy (DPDP Act, 2023)</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <ClinicFooter clinic={clinic} doctor={doctor}/>

      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
          style={{ width:50, height:50, borderRadius:"50%", background:"#25d366", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none", boxShadow:"0 4px 16px rgba(37,211,102,0.4)", transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none", boxShadow:`0 4px 16px rgba(192,57,43,0.4)`, transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>📞</a>
      </div>
    </div>
  );
}
