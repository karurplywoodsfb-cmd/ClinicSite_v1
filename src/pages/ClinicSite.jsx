// src/pages/ClinicSite.jsx
// Patient-facing clinic site — switches template based on clinic.template field
// Templates: default | corporate-giant | nordic-sanctuary | elite-aesthetics | telehealth-platform | surgical-hub

import { useState, useEffect, useRef } from "react";
import {
  getClinicBySlug,
  getServices,
  getDoctors,
  getClinicMedia,
  getSeoData,
} from "../lib/supabase";

// ── Template imports ──────────────────────────────────────────────
import CorporateGiant      from "../templates/CorporateGiant";
import NordicSanctuary     from "../templates/NordicSanctuary";
import EliteAesthetics     from "../templates/EliteAesthetics";
import TelehealthPlatform  from "../templates/TelehealthPlatform";
import SurgicalHub         from "../templates/SurgicalHub";

// ── Default template components (inline) ─────────────────────────
// Keep the original default layout here so nothing breaks for
// clinics that haven't chosen a template yet.

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

// ── SEO head injection ────────────────────────────────────────────
function ClinicSEOHead({ clinic, seoData }) {
  useEffect(() => {
    if (!clinic) return;
    const title = seoData?.meta_title || `${clinic.name} — ${clinic.specialty || "Clinic"} in ${clinic.city}`;
    const desc  = seoData?.meta_description || clinic.about || `Book appointments at ${clinic.name} in ${clinic.city}.`;
    document.title = title;
    const setMeta = (name, content, prop = "name") => {
      let el = document.querySelector(`meta[${prop}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(prop, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", desc);
    setMeta("og:title",       title,        "property");
    setMeta("og:description", desc,         "property");
    setMeta("og:type",        "website",    "property");
    setMeta("twitter:card",   "summary_large_image");
    setMeta("twitter:title",  title);
    setMeta("twitter:description", desc);
  }, [clinic, seoData]);
  return null;
}

// ── Specialty-aware FAQ ───────────────────────────────────────────
const FAQ_MAP = {
  Dental: [
    ["Is dental implant treatment painful?",
     "Dental implants are placed under local anaesthesia. Most patients compare the experience to a routine filling. Some mild soreness for 1–2 days afterwards is normal and manageable with standard pain relief."],
    ["How long does a root canal take?",
     "Most root canal treatments are completed in one or two appointments of approximately 60–90 minutes each, depending on the tooth and complexity."],
    ["What does professional dental cleaning involve?",
     "A professional cleaning (scaling and polishing) removes plaque and tartar that cannot be removed by brushing alone. It takes around 30–45 minutes and is recommended every 6 months."],
    ["Do you provide treatment for children?",
     "Yes. We provide child-friendly dental care from age 3 onwards, including preventive treatments, fluoride application, and routine checkups."],
    ["How do I book an appointment?",
     "You can book using the form on this page, call us directly, or send a WhatsApp message. We confirm appointments within 30 minutes during clinic hours."],
  ],
  Dermatology: [
    ["When should I see a dermatologist for acne?",
     "If over-the-counter products have not helped after 2–3 months, or if acne is leaving scars, a dermatologist consultation is recommended. Early intervention generally produces better outcomes."],
    ["Is laser treatment safe for Indian skin?",
     "Many laser and light-based treatments are suitable for Indian skin tones, but the specific device and parameters matter. Your dermatologist will assess your skin type and recommend the safest option."],
    ["How do I prepare for my first skin consultation?",
     "Come with clean skin, bring a list of current products you use, and note any medications. Photos of flare-ups are helpful. Avoid applying makeup to the area of concern on the day."],
    ["How do I book an appointment?",
     "Use the form on this page, call us, or send a WhatsApp message. We respond within 30 minutes during clinic hours."],
  ],
  default: [
    ["How do I book an appointment?",
     "Use the booking form on this page, call us directly, or send a WhatsApp message. We respond within 30 minutes during clinic hours."],
    ["What should I bring to my first appointment?",
     "Please bring any relevant previous medical reports, prescriptions, or investigation results. Arriving 10 minutes early is appreciated to complete a brief registration form."],
    ["Do you accept walk-in patients?",
     "Walk-ins are welcome subject to availability. We recommend booking in advance to avoid waiting."],
    ["How can I access my consultation summary?",
     "We can provide a printed summary of your consultation on request. Please ask at the front desk before leaving."],
    ["Is my personal data safe?",
     "Yes. We collect only the information necessary to manage your appointment. Your data is handled under our Privacy Policy and the Digital Personal Data Protection Act, 2023."],
  ],
};

function FAQSection({ clinic }) {
  const [open, setOpen] = useState(null);
  const faqs = FAQ_MAP[clinic.specialty] || FAQ_MAP.default;
  const schema = {
    "@context": "https://schema.org",
    "@type":    "FAQPage",
    "mainEntity": faqs.map(([q, a]) => ({
      "@type": "Question",
      "name":  q,
      "acceptedAnswer": { "@type": "Answer", "text": a },
    })),
  };
  return (
    <section id="faq" style={{ padding:"80px 40px", background:"white", fontFamily:"'DM Sans',sans-serif" }}>
      <div dangerouslySetInnerHTML={{ __html: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` }}/>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <Reveal>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>FAQ</div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(26px,3vw,36px)", color:"#0b2545", marginBottom:40 }}>
            Frequently Asked Questions
          </h2>
        </Reveal>
        <div style={{ maxWidth:720 }}>
          {faqs.map(([q, a], i) => (
            <div key={i} style={{ borderBottom:"1px solid #dce8f5" }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"18px 0", cursor:"pointer", fontSize:15, fontWeight:600, background:"none", border:"none",
                  color: open === i ? "#1565c0" : "#0b2545", gap:16, fontFamily:"'DM Sans',sans-serif", textAlign:"left" }}>
                {q}
                <span style={{ fontSize:18, color:"#1565c0", transition:"transform .3s",
                  transform: open === i ? "rotate(180deg)" : "none", flexShrink:0 }}>⌄</span>
              </button>
              {open === i && (
                <div style={{ fontSize:14, color:"#5a7a96", lineHeight:1.75, paddingBottom:16 }}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PageLoader({ message }) {
  return (
    <div style={{ minHeight:"100vh", background:"#f0f7ff", display:"flex",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:40 }}>🏥</div>
      <div style={{ color:"#5a7a96", fontSize:14 }}>{message || "Loading..."}</div>
    </div>
  );
}

// ── Template registry ─────────────────────────────────────────────
// Maps clinic.template value → component
// Supports both short IDs (from TEMPLATES object) and long slugs
const TEMPLATE_MAP = {
  // Short IDs — what AdminPanel saves via TEMPLATES object
  "corporate":     CorporateGiant,
  "nordic":        NordicSanctuary,
  "elite":         EliteAesthetics,
  "telehealth":    TelehealthPlatform,
  "surgical":      SurgicalHub,
  // Long slug aliases (fallback)
  "corporate-giant":     CorporateGiant,
  "nordic-sanctuary":    NordicSanctuary,
  "elite-aesthetics":    EliteAesthetics,
  "telehealth-platform": TelehealthPlatform,
  "surgical-hub":        SurgicalHub,
};

// ── Default layout (used when no template is selected) ────────────
function DefaultClinicLayout({ clinic, services, doctors, media, seoData, onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => { if (onBookClick) onBookClick(); else setShowBook(true); };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Dynamic imports for BookingEngine & ClinicFooter
  const [BookingEngine, setBookingEngine]   = useState(null);
  const [ClinicFooter,  setClinicFooter]    = useState(null);
  const [ClinicMedia,   setClinicMedia]     = useState(null);

  useEffect(() => {
    import("../components/BookingEngine").then(m => setBookingEngine(() => m.default));
    import("../components/ClinicFooter").then(m => setClinicFooter(() => m.default));
    import("../components/ClinicMediaSection").then(m => setClinicMedia(() => m.default));
  }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#f4f8fd", overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      {/* Booking Modal */}
      {showBook && BookingEngine && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:300,
            background:"rgba(11,37,69,0.65)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={() => setShowBook(false)} style={{ position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:"white",
              border:"none", cursor:"pointer", fontSize:16 }}>✕</button>
            <BookingEngine clinic={clinic} services={activeServices}/>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background: scrolled ? "rgba(244,248,253,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #dce8f5" : "1px solid transparent",
        transition:"all .3s", padding:"0 40px", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#1565c0,#1e88e5)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🏥</div>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:"#0b2545" }}>{clinic.name}</div>
            {clinic.specialty && <div style={{ fontSize:10, color:"#1565c0", letterSpacing:1.2, textTransform:"uppercase" }}>{clinic.specialty}</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          {[["Services","#services"],["Doctor","#doctor"],["Articles","#articles"],["Contact","#contact"]].map(([l,h]) => (
            <a key={l} href={h} style={{ textDecoration:"none", color:"#5a7a96", fontSize:13, fontWeight:500 }}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background:"#1565c0", color:"white", border:"none", borderRadius:8, padding:"9px 20px",
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 14px rgba(21,101,192,0.25)" }}>
            📅 Book Appointment
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight:"100vh", paddingTop:64, background:"linear-gradient(160deg,#ffffff 0%,#e8f4fd 60%,#d4ecfc 100%)",
        display:"flex", alignItems:"center", padding:"80px 40px",
      }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:80, alignItems:"center", width:"100%" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8,
              background:"rgba(21,101,192,0.08)", border:"1px solid rgba(21,101,192,0.15)", borderRadius:20,
              padding:"5px 14px", fontSize:11, color:"#1565c0", fontWeight:600, letterSpacing:1.5,
              textTransform:"uppercase", marginBottom:24 }}>
              {clinic.specialty} · {clinic.city}
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif",
              fontSize:"clamp(36px,4.5vw,56px)", color:"#0b2545", lineHeight:1.1, marginBottom:20 }}>
              {clinic.heroTagline || (<>Expert {clinic.specialty} Care<br/>in {clinic.city}</>)}
            </h1>
            <p style={{ fontSize:16, color:"#5a7a96", lineHeight:1.8, marginBottom:36, maxWidth:460 }}>
              {clinic.about || `${clinic.name} provides specialist ${(clinic.specialty||"").toLowerCase()} care in ${clinic.city}.`}
            </p>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={handleBook} style={{
                background:"linear-gradient(135deg,#1565c0,#1e88e5)", color:"white", border:"none",
                borderRadius:10, padding:"14px 28px", fontSize:15, fontWeight:600, cursor:"pointer",
                fontFamily:"inherit", boxShadow:"0 8px 24px rgba(21,101,192,0.3)" }}>
                📅 Book Appointment
              </button>
              <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ background:"#25d366", color:"white", borderRadius:10, padding:"14px 20px",
                  fontSize:15, fontWeight:600, textDecoration:"none" }}>
                💬 WhatsApp
              </a>
              <a href={`tel:${clinic.phone}`}
                style={{ background:"transparent", color:"#1565c0", border:"1.5px solid #1565c0",
                  borderRadius:10, padding:"13px 18px", fontSize:15, fontWeight:600, textDecoration:"none" }}>
                📞 Call
              </a>
            </div>
            <div style={{ display:"flex", gap:32, marginTop:40 }}>
              {[
                doctor?.experience && [doctor.experience, "Clinical Experience"],
                activeServices.length > 0 && [`${activeServices.length}+`, "Services"],
                doctor?.reg_number && ["Registered", "Medical Practitioner"],
              ].filter(Boolean).map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:"#0b2545" }}>{n}</div>
                  <div style={{ fontSize:12, color:"#5a7a96" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Booking card */}
          <div style={{ background:"white", borderRadius:20, boxShadow:"0 24px 64px rgba(11,37,69,0.12)", overflow:"hidden" }}>
            <div style={{ background:"linear-gradient(135deg,#0b2545,#1565c0)", padding:"24px 28px", color:"white" }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, marginBottom:4 }}>Book Appointment</div>
              <div style={{ fontSize:13, opacity:.7 }}>Free consultation for new patients</div>
            </div>
            <div style={{ padding:24 }}>
              {[["Full Name","Your name"],["Phone","98400 00000"]].map(([l, p]) => (
                <div key={l} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginBottom:5, fontWeight:600 }}>{l.toUpperCase()}</div>
                  <input placeholder={p} style={{
                    width:"100%", background:"#f4f8fd", border:"1.5px solid #dce8f5", borderRadius:8,
                    padding:"10px 12px", fontSize:14, color:"#0b2545", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              {activeServices.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginBottom:5, fontWeight:600 }}>SERVICE</div>
                  <select style={{ width:"100%", background:"#f4f8fd", border:"1.5px solid #dce8f5", borderRadius:8,
                    padding:"10px 12px", fontSize:14, color:"#0b2545", fontFamily:"inherit", outline:"none" }}>
                    {activeServices.map(s => <option key={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleBook} style={{
                width:"100%", background:"linear-gradient(135deg,#1565c0,#1e88e5)", color:"white",
                border:"none", borderRadius:8, padding:"13px", fontSize:14, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(21,101,192,0.3)" }}>
                Check Available Slots →
              </button>
              <div style={{ fontSize:10, color:"#94a3b8", textAlign:"center", marginTop:10 }}>
                🔒 Data protected under DPDP Act, 2023
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"80px 40px", background:"#f4f8fd" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <Reveal>
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>Our Services</div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(26px,3vw,36px)", color:"#0b2545", marginBottom:48 }}>Clinical Services</h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
              {activeServices.map((svc, i) => (
                <Reveal key={svc.id || i} delay={i * 0.06}>
                  <div style={{ background:"white", borderRadius:14, padding:"22px 18px",
                    border:"1px solid #dce8f5", transition:"all .25s", cursor:"pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(11,37,69,0.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{svc.icon || "🏥"}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#0b2545", marginBottom:6 }}>{svc.name}</div>
                    {svc.description && <div style={{ fontSize:12, color:"#5a7a96", lineHeight:1.5, marginBottom:10 }}>{svc.description}</div>}
                    {svc.price && !svc.hide_price && <div style={{ fontSize:13, fontWeight:600, color:"#1565c0" }}>Fee: {svc.price}</div>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Doctor */}
      {doctors[0] && (
        <section id="doctor" style={{ padding:"80px 40px", background:"white" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:60, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:20,
                background:"linear-gradient(160deg,#e3f2fd,#c8e6fa)",
                display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                {doctors[0].photo_url
                  ? <img src={doctors[0].photo_url} alt={doctors[0].name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:100 }}>👨‍⚕️</span>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>Your Doctor</div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:36, color:"#0b2545", marginBottom:6 }}>{doctors[0].name}</h2>
              <div style={{ color:"#1565c0", fontWeight:600, fontSize:15, marginBottom:6 }}>{doctors[0].degree}</div>
              {doctors[0].reg_number && (
                <div style={{ fontSize:11, color:"#94a3b8", marginBottom:20, fontFamily:"monospace" }}>
                  Reg No: {doctors[0].reg_number}{doctors[0].council_name ? ` — ${doctors[0].council_name}` : ""}
                </div>
              )}
              {doctors[0].bio && <p style={{ color:"#5a7a96", lineHeight:1.8, fontSize:15, marginBottom:28 }}>{doctors[0].bio}</p>}
              <button onClick={handleBook} style={{
                background:"linear-gradient(135deg,#1565c0,#1e88e5)", color:"white", border:"none",
                borderRadius:10, padding:"14px 28px", fontSize:15, fontWeight:600, cursor:"pointer",
                fontFamily:"inherit", boxShadow:"0 8px 24px rgba(21,101,192,0.3)" }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      {ClinicMedia && <ClinicMedia clinic={clinic} mediaItems={media}/>}

      <FAQSection clinic={clinic}/>

      {/* Contact */}
      <section id="contact" style={{ padding:"80px 40px", background:"#f4f8fd" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60 }}>
          <Reveal>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>Find Us</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, color:"#0b2545", marginBottom:32 }}>Visit {clinic.name}</h2>
            {[["📍","Address",clinic.address||`${clinic.city}, Tamil Nadu`],["📞","Phone",clinic.phone],["✉️","Email",clinic.email]]
              .filter(([,,v])=>v).map(([icon,label,value]) => (
              <div key={label} style={{ display:"flex", gap:16, marginBottom:20, alignItems:"flex-start" }}>
                <div style={{ width:42, height:42, borderRadius:10, background:"white", border:"1px solid #dce8f5",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:14, color:"#0b2545" }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background:"white", borderRadius:14, padding:28, border:"1px solid #dce8f5" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0b2545", marginBottom:16 }}>Clinic Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([d,h,o]) => (
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f0f6ff", fontSize:13 }}>
                  <span style={{ color:"#5a7a96" }}>{d}</span>
                  <span style={{ fontWeight:600, color: o?"#1565c0":"#ef4444" }}>{h}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"#25d366", color:"white", borderRadius:8, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  💬 WhatsApp
                </a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:"linear-gradient(135deg,#1565c0,#1e88e5)", color:"white", borderRadius:8, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  📞 Call Now
                </a>
              </div>
              <div style={{ marginTop:14, textAlign:"center" }}>
                <a href={`/${clinic.slug}/privacy-policy`} style={{ fontSize:11, color:"#94a3b8", textDecoration:"none" }}>Privacy Policy (DPDP Act, 2023)</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {ClinicFooter && <ClinicFooter clinic={clinic} doctor={doctors[0]}/>}

      {/* Floating buttons */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
          style={{ width:50, height:50, borderRadius:"50%", background:"#25d366",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(37,211,102,0.4)", transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:"#1565c0",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(21,101,192,0.4)", transition:"transform .2s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>📞</a>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function ClinicSite({ slug }) {
  // Support both prop-based and route-based slug
  // slug passed as prop from Router

  const [clinic,   setClinic]   = useState(null);
  const [services, setServices] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [media,    setMedia]    = useState([]);
  const [seoData,  setSeoData]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showBook, setShowBook] = useState(false);

  useEffect(() => { if (slug) loadAll(); }, [slug]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const c = await getClinicBySlug(slug);
      if (!c) {
        setError("Clinic not found or site is not published.");
        setLoading(false);
        return;
      }
      const [svcs, docs, mediaItems, seo] = await Promise.allSettled([
        getServices(c.id),
        getDoctors(c.id),
        getClinicMedia(c.id),
        getSeoData(c.id),
      ]);
      setClinic(c);
      setServices(svcs.status === "fulfilled" ? svcs.value : []);
      setDoctors(docs.status  === "fulfilled" ? docs.value  : []);
      setMedia(mediaItems.status === "fulfilled" ? mediaItems.value : []);
      setSeoData(seo.status === "fulfilled" ? seo.value : null);
    } catch (err) {
      setError("Something went wrong loading this page.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader message="Loading clinic site…"/>;
  if (error)   return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:40 }}>😕</div>
      <div style={{ color:"#64748b" }}>{error}</div>
    </div>
  );
  if (!clinic) return null;

  // ── Template switching ────────────────────────────────────────
  // clinic.template should be one of the keys in TEMPLATE_MAP
  // Falls back to DefaultClinicLayout if not set or unrecognised
  const templateKey    = (clinic.template || "").toLowerCase().trim();
  const TemplateComponent = TEMPLATE_MAP[templateKey];

  const sharedProps = {
    clinic,
    services,
    doctors,
    media,
    onBookClick: () => setShowBook(true),
  };

  return (
    <>
      <ClinicSEOHead clinic={clinic} seoData={seoData}/>

      {TemplateComponent
        ? <TemplateComponent {...sharedProps}/>
        : <DefaultClinicLayout {...sharedProps} seoData={seoData}/>
      }

      {/* Global BookingEngine modal — triggered by onBookClick from any template */}
      {showBook && (
        <GlobalBookingModal
          clinic={clinic}
          services={services.filter(s => s.is_active !== false)}
          onClose={() => setShowBook(false)}
        />
      )}
    </>
  );
}

// ── Global Booking Modal ──────────────────────────────────────────
// Shared across all templates — triggered via onBookClick prop
function GlobalBookingModal({ clinic, services, onClose }) {
  const [BookingEngine, setBookingEngine] = useState(null);
  useEffect(() => {
    import("../components/BookingEngine").then(m => setBookingEngine(() => m.default));
  }, []);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, zIndex:400,
        background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
        <button onClick={onClose} style={{
          position:"absolute", top:-14, right:-14, zIndex:10,
          width:32, height:32, borderRadius:"50%", background:"white",
          border:"none", cursor:"pointer", fontSize:16, boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>✕</button>
        {BookingEngine
          ? <BookingEngine clinic={clinic} services={services}/>
          : <div style={{ background:"white", borderRadius:16, padding:40, textAlign:"center", color:"#64748b" }}>Loading…</div>
        }
      </div>
    </div>
  );
}