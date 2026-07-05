// src/templates/CorporateGiant.jsx
// Corporate, authoritative — dark navy + gold accents
// Accepts: clinic, services, doctors, media, onBookClick

import { useState, useEffect, useRef } from "react";
import BookingEngine      from "../components/BookingEngine";
import ClinicFooter          from "../components/ClinicFooter";
import WorkingHoursDisplay   from "../components/WorkingHoursDisplay";
import ClinicMediaSection from "../components/ClinicMediaSection";

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

export default function CorporateGiant({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => {
    if (onBookClick) onBookClick();
    else setShowBook(true);
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const C = {
    bg: "#0b1929",
    surface: "#112240",
    accent: "#c9a84c",
    accentLight: "#f0d080",
    text: "#e8edf2",
    muted: "#8899aa",
    border: "rgba(201,168,76,0.2)",
    white: "#ffffff",
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background: C.bg, color: C.text, overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      {/* ── Booking Modal ── */}
      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300,
            background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={() => setShowBook(false)} style={{
              position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:C.white,
              border:"none", cursor:"pointer", fontSize:16 }}>✕</button>
            <BookingEngine hours={hours} branches={branches} clinic={clinic} services={activeServices}/>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background: scrolled ? "rgba(11,25,41,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        transition:"all .3s", padding:"0 24px", height:68,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt={clinic.name}
                  style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
              : <div style={{ width:36, height:36, borderRadius:8,
                  background:`linear-gradient(135deg,${C.accent||C.primary||"#1565c0"},${C.accentLight||C.primaryLight||"#1e88e5"})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"white", fontSize:15, fontWeight:700 }}>
                  {(clinic.name||"C").charAt(0).toUpperCase()}
                </div>
            }
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.white, letterSpacing:.3 }}>{clinic.name}</div>
            {clinic.specialty && <div style={{ fontSize:10, color:C.accent, letterSpacing:1.5, textTransform:"uppercase" }}>{clinic.specialty}</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:28, alignItems:"center" }}>
          {[["Services","#services"],["Doctor","#doctor"],["Contact","#contact"]].map(([l,h]) => (
            <a key={l} href={h} style={{ textDecoration:"none", color:C.muted, fontSize:13, fontWeight:500, transition:"color .15s" }}
              onMouseEnter={e=>e.target.style.color=C.accentLight}
              onMouseLeave={e=>e.target.style.color=C.muted}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background:`linear-gradient(135deg,${C.accent},${C.accentLight})`,
            color:C.bg, border:"none", borderRadius:6, padding:"9px 22px",
            fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:.4 }}>
            Book Appointment
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight:"100vh", paddingTop:68,
        background:`radial-gradient(ellipse 70% 60% at 80% 50%, rgba(201,168,76,0.08), transparent), ${C.bg}`,
        display:"flex", alignItems:"center", padding:"80px 24px",
      }}>
        <div style={{ width:"100%", display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:80, alignItems:"center", width:"100%" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8,
              border:`1px solid ${C.border}`, borderRadius:4, padding:"5px 14px",
              fontSize:11, fontWeight:600, color:C.accent, letterSpacing:2,
              textTransform:"uppercase", marginBottom:28 }}>
              {clinic.specialty} · {clinic.city}
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(38px,4.5vw,60px)",
              color:C.white, lineHeight:1.1, marginBottom:24 }}>
              {clinic.heroTagline || (<>Clinical Excellence<br/><em style={{ color:C.accent }}>You Can Trust</em></>)}
            </h1>
            <p style={{ fontSize:16, color:C.muted, lineHeight:1.8, marginBottom:40, maxWidth:480 }}>
              {clinic.about || `${clinic.name} delivers specialist ${(clinic.specialty||"").toLowerCase()} care in ${clinic.city}.`}
            </p>
            <div style={{ display:"flex", gap:14 }}>
              <button onClick={handleBook} style={{
                background:`linear-gradient(135deg,${C.accent},${C.accentLight})`,
                color:C.bg, border:"none", borderRadius:8, padding:"15px 32px",
                fontSize:15, fontWeight:700, cursor:"pointer", letterSpacing:.5 }}>
                📅 Book Appointment
              </button>
              <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ background:"transparent", color:C.accent, border:`1.5px solid ${C.border}`,
                  borderRadius:8, padding:"14px 24px", fontSize:15, fontWeight:600, textDecoration:"none" }}>
                💬 WhatsApp
              </a>
            </div>
            <div style={{ display:"flex", gap:40, marginTop:48, paddingTop:32,
              borderTop:`1px solid ${C.border}` }}>
              {[
                doctor?.experience && [doctor.experience, "Clinical Experience"],
                activeServices.length>0 && [`${activeServices.length}+`, "Services Offered"],
                doctor?.reg_number && ["Registered", "Medical Practitioner"],
              ].filter(Boolean).map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.accent }}>{n}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Booking card */}
          <div style={{ background:C.surface, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>
            <div style={{ background:`linear-gradient(135deg,${C.accent},${C.accentLight})`, padding:"24px 28px" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.bg, marginBottom:4 }}>Request Appointment</div>
              <div style={{ fontSize:12, color:"rgba(11,25,41,0.65)" }}>Confirmed within clinic hours</div>
            </div>
            <div style={{ padding:24 }}>
              {[["Full Name","Your name"],["Phone","98400 00000"]].map(([l,p]) => (
                <div key={l} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, color:C.accent, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>{l}</div>
                  <input placeholder={p} style={{ width:"100%", background:"rgba(255,255,255,0.05)",
                    border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 12px",
                    fontSize:14, color:C.white, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <button onClick={handleBook} style={{
                width:"100%", background:`linear-gradient(135deg,${C.accent},${C.accentLight})`,
                color:C.bg, border:"none", borderRadius:7, padding:"13px",
                fontSize:14, fontWeight:700, cursor:"pointer", marginTop:4 }}>
                Check Available Slots →
              </button>
              <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:10 }}>
                🔒 Protected under DPDP Act, 2023
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"80px 24px", background:C.surface }}>
          <div style={{ width:"100%" }}>
            <Reveal>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Our Services</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,3vw,38px)", color:C.white, marginBottom:48 }}>Clinical Services</h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
              {activeServices.map((svc, i) => (
                <Reveal key={svc.id||i} delay={i*0.05}>
                  <div style={{ background:C.bg, borderRadius:12, padding:"24px 20px",
                    border:`1px solid ${C.border}`, transition:"all .25s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.transform="translateY(-4px)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="none"}}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{svc.icon||"🏥"}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.white, marginBottom:6 }}>{svc.name}</div>
                    {svc.description && <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{svc.description}</div>}
                    {svc.price && !svc.hide_price && <div style={{ fontSize:12, fontWeight:600, color:C.accent, marginTop:10 }}>Fee: {svc.price}</div>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Doctor ── */}
      {doctor && (
        <section id="doctor" style={{ padding:"80px 24px", background:C.bg }}>
          <div style={{ width:"100%", display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:60, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:16,
                background:`linear-gradient(160deg,${C.surface},${C.bg})`,
                border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative", overflow:"hidden" }}>
                {doctor.photo_url
                  ? <img src={doctor.photo_url} alt={doctor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:100 }}>👨‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Your Doctor</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, color:C.white, marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:C.accent, fontWeight:600, fontSize:15, marginBottom:6 }}>{doctor.degree}</div>
              {doctor.reg_number && (
                <div style={{ fontSize:11, color:C.muted, marginBottom:20, fontFamily:"monospace" }}>
                  Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}
                </div>
              )}
              {doctor.bio && <p style={{ color:C.muted, lineHeight:1.8, fontSize:15, marginBottom:28 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background:`linear-gradient(135deg,${C.accent},${C.accentLight})`,
                color:C.bg, border:"none", borderRadius:8, padding:"14px 28px",
                fontSize:15, fontWeight:700, cursor:"pointer" }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding:"80px 24px", background:C.surface }}>
        <div style={{ width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60 }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:C.accent, marginBottom:10 }}>Find Us</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:34, color:C.white, marginBottom:32 }}>Visit {clinic.name}</h2>
            {[
              ["📍","Address", clinic.address||`${clinic.city}, Tamil Nadu`],
              ["📞","Phone",   clinic.phone],
              ["✉️","Email",   clinic.email],
            ].filter(([,,v])=>v).map(([icon,label,value])=>(
              <div key={label} style={{ display:"flex", gap:16, marginBottom:20, alignItems:"flex-start" }}>
                <div style={{ width:42, height:42, borderRadius:10, background:C.bg,
                  border:`1px solid ${C.border}`, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:14, color:C.text }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:C.bg, borderRadius:14, padding:28, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.white, marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o])=>(
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                  <span style={{ color:C.muted }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?"#4ade80":"#f87171" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"white", borderRadius:8, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  💬 WhatsApp
                </a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:`linear-gradient(135deg,${C.accent},${C.accentLight})`, color:C.bg, borderRadius:8, padding:"12px", textAlign:"center", fontSize:13, fontWeight:700, textDecoration:"none" }}>
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

      {/* Floating buttons */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
          style={{ width:50, height:50, borderRadius:"50%", background:"#25d366",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(37,211,102,0.4)", transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:`0 4px 16px rgba(201,168,76,0.4)`, transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>📞</a>
      </div>
    </div>
  );
}
