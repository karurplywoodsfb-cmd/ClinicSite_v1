// src/pages/ClinicSite.jsx — FINAL
// Compliance: No patient testimonials, mandatory Reg No footer,
//             DPDP consent in booking, compliant copy

import { useState, useEffect, useRef } from "react";
import { supabase, getClinicBySlug, getServices, getDoctors } from "../lib/supabase";
import BookingEngine     from "../components/BookingEngine";
import ClinicFooter      from "../components/ClinicFooter";
import ClinicMediaSection from "../components/ClinicMediaSection";
import { TEMPLATES, suggestTemplate } from "../templates";

// ── SEO injector ──────────────────────────────────────────────────
function injectSEO(clinic, services, doctor) {
  const city     = clinic.city;
  const specialty= clinic.specialty || "Dental";
  document.title = `${clinic.name} | ${specialty} Clinic in ${city} | Book Appointment`;

  const setMeta = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
    el.content = content;
  };
  setMeta("description", `${clinic.name} — Expert ${specialty.toLowerCase()} care in ${city}. ${services.slice(0,3).map(s=>s.name).join(", ")}. Book appointment online.`);
  setMeta("keywords",    `${specialty.toLowerCase()} in ${city}, ${clinic.name.toLowerCase()}, best dentist ${city}, ${specialty.toLowerCase()} clinic ${city}`);
  setMeta("robots",      "index, follow");

  const schema = {
    "@context":"https://schema.org",
    "@type":["MedicalClinic","LocalBusiness"],
    "name": clinic.name,
    "medicalSpecialty": specialty,
    "address": { "@type":"PostalAddress", "addressLocality":city, "addressCountry":"IN" },
    "telephone": clinic.phone,
    "availableService": services.map(s=>({ "@type":"MedicalProcedure","name":s.name })),
    ...(doctor?.reg_number && { "employee": { "@type":"Physician","name":doctor.name,"identifier":doctor.reg_number } }),
  };
  let s = document.getElementById("clinic-schema");
  if (!s) { s = document.createElement("script"); s.id="clinic-schema"; s.type="application/ld+json"; document.head.appendChild(s); }
  s.textContent = JSON.stringify(schema);
}

// ── Reveal hook ───────────────────────────────────────────────────
function Reveal({ children, delay=0 }) {
  const ref  = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold:.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity:vis?1:0, transform:vis?"none":"translateY(20px)", transition:`opacity .6s ${delay}s, transform .6s ${delay}s` }}>
      {children}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────
function Navbar({ clinic, onBookClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:scrolled?"rgba(255,255,255,0.97)":"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${scrolled?"#dce8f5":"transparent"}`, boxShadow:scrolled?"0 2px 20px rgba(11,37,69,0.07)":"none", transition:"all .3s", padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"'DM Sans',sans-serif" }}>
      <a href={`/${clinic.slug}`} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#1565c0,#1e88e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🦷</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#0b2545", lineHeight:1.1 }}>{clinic.name}</div>
          <div style={{ fontSize:10, color:"#5a7a96" }}>{clinic.tagline}</div>
        </div>
      </a>
      <div style={{ display:"flex", gap:24 }}>
        {["Services","Doctor","Facility","Contact"].map(l=>(
          <a key={l} href={`#${l.toLowerCase()}`} style={{ textDecoration:"none", color:"#5a7a96", fontSize:13, fontWeight:500 }}>{l}</a>
        ))}
        <a href={`/${clinic.slug}/blog`} style={{ textDecoration:"none", color:"#5a7a96", fontSize:13, fontWeight:500 }}>Health Articles</a>
      </div>
      <button onClick={onBookClick} style={{ background:"#1565c0", color:"white", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(21,101,192,0.25)" }}>
        📅 Book Appointment
      </button>
    </nav>
  );
}

// ── FAQ section ───────────────────────────────────────────────────
const FAQS_BY_SPECIALTY = {
  Dental: [
    ["Is dental implant treatment painful?", "Dental implants are placed under local anaesthesia. Most patients describe the experience as similar to a routine filling. Mild soreness for 1–2 days afterwards is normal and manageable with standard pain relief."],
    ["How long does a root canal take?", "Most root canal treatments are completed in one or two appointments of 60–90 minutes each, depending on the tooth and complexity."],
    ["What is the cost of a dental implant in " + "Karur?", "Implant fees vary depending on the case. Please book a consultation for an accurate assessment and treatment quote."],
    ["Do you treat children?", "Yes. Our team provides child-friendly dental care from age 3 onwards, including preventive treatments and routine checkups."],
    ["Can I book an appointment online?", "Yes — use the booking form on this page or contact us via WhatsApp. We confirm appointments within 30 minutes during clinic hours."],
  ],
  default: [
    ["How do I book an appointment?", "Use the booking form on this page, call us directly, or send a WhatsApp message. We respond within 30 minutes during clinic hours."],
    ["What should I bring to my first appointment?", "Please bring any relevant previous medical reports, prescriptions, or test results. Arriving 10 minutes early is appreciated."],
    ["Do you accept walk-in patients?", "Walk-ins are welcome subject to availability. Booking in advance is recommended to avoid waiting."],
    ["How do I access my consultation notes?", "We can provide a printed summary after your consultation on request."],
  ],
};

function FAQSection({ specialty, city }) {
  const [open, setOpen] = useState(null);
  const faqs = FAQS_BY_SPECIALTY[specialty] || FAQS_BY_SPECIALTY.default;
  const schema = { "@context":"https://schema.org","@type":"FAQPage","mainEntity": faqs.map(([q,a])=>({ "@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a} })) };
  return (
    <section id="faq" style={{ padding:"80px 40px", background:"white", fontFamily:"'DM Sans',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html:JSON.stringify(schema) }}/>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <Reveal>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>FAQ</div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(26px,3vw,36px)", color:"#0b2545", marginBottom:40 }}>Frequently Asked Questions</h2>
        </Reveal>
        <div style={{ maxWidth:720 }}>
          {faqs.map(([q,a],i)=>(
            <div key={i} style={{ borderBottom:"1px solid #dce8f5" }}>
              <div onClick={()=>setOpen(open===i?null:i)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 0", cursor:"pointer", fontSize:15, fontWeight:600, color:open===i?"#1565c0":"#0b2545", gap:16 }}>
                {q} <span style={{ fontSize:18, color:"#1565c0", transition:"transform .3s", transform:open===i?"rotate(180deg)":"none", flexShrink:0 }}>⌄</span>
              </div>
              {open===i&&<div style={{ fontSize:14, color:"#5a7a96", lineHeight:1.7, paddingBottom:16 }}>{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ClinicSite({ slug }) {
  const [clinic,   setClinic]   = useState(null);
  const [services, setServices] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [media,    setMedia]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showBook, setShowBook] = useState(false);

  useEffect(() => { loadAll(); }, [slug]);

  const loadAll = async () => {
    try {
      const c = await getClinicBySlug(slug);
      if (!c) { setError("Clinic not found"); setLoading(false); return; }
      const [svcs, docs] = await Promise.all([
        getServices(c.id),
        getDoctors(c.id),
      ]);
      // Load clinic media (replaces reviews)
      const { data: mediaItems } = await supabase.from("clinic_media").select("*").eq("clinic_id", c.id).eq("is_active", true).order("sort_order");
      setClinic(c);
      setServices(svcs || []);
      setDoctors(docs || []);
      setMedia(mediaItems || []);
      injectSEO(c, svcs || [], docs?.[0]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#f0f7ff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:40 }}>🦷</div>
      <div style={{ color:"#5a7a96" }}>Loading {slug}...</div>
    </div>
  );
  if (error || !clinic) return (
    <div style={{ minHeight:"100vh", background:"#f0f7ff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <div style={{ color:"#ef4444", fontWeight:600 }}>Clinic not found</div>
      <div style={{ color:"#64748b", fontSize:14 }}>{error}</div>
    </div>
  );

  // Select template based on clinic.template or specialty
  const templateKey  = clinic.template || suggestTemplate(clinic.specialty);
  const TemplateComp = TEMPLATES[templateKey]?.component;

  // If template is selected and it's not "custom", render full template
  // Otherwise render standard layout below
  const doctor = doctors[0];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#0b2545", background:"white", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <Navbar clinic={clinic} onBookClick={()=>setShowBook(true)}/>

      {/* Booking Modal */}
      {showBook&&(
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(11,37,69,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflowY:"auto" }}
          onClick={e=>e.target===e.currentTarget&&setShowBook(false)}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={()=>setShowBook(false)} style={{ position:"absolute", top:-14, right:-14, zIndex:10, width:32, height:32, borderRadius:"50%", background:"white", border:"none", cursor:"pointer", fontSize:16, boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>✕</button>
            <BookingEngine clinic={clinic} services={services.filter(s=>s.is_active)}/>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh", paddingTop:64, background:"radial-gradient(ellipse 80% 60% at 70% 50%,rgba(21,101,192,0.07),transparent),linear-gradient(160deg,#f0f7ff 0%,#ffffff 60%)", display:"flex", alignItems:"center", padding:"80px 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center", width:"100%" }}>
          <div>
            {/* Compliant badge — specialty + location only */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(21,101,192,0.08)", border:"1px solid rgba(21,101,192,0.18)", borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600, color:"#1565c0", marginBottom:20 }}>
              🦷 {clinic.specialty} Clinic · {clinic.city}, Tamil Nadu
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(36px,4.5vw,54px)", color:"#0b2545", lineHeight:1.15, marginBottom:20 }}>
              {clinic.heroTagline || <>Your Health Deserves<br/><em style={{ fontStyle:"italic", color:"#1e88e5" }}>Specialist Care</em></>}
            </h1>
            <p style={{ fontSize:16, color:"#5a7a96", lineHeight:1.7, marginBottom:32, maxWidth:460 }}>
              {clinic.about || `${clinic.name} provides expert ${(clinic.specialty||"").toLowerCase()} care in ${clinic.city}. Delivered by qualified specialists using evidence-based clinical practice.`}
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
              <button onClick={()=>setShowBook(true)} style={{ background:"#1565c0", color:"white", border:"none", borderRadius:10, padding:"14px 28px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 16px rgba(21,101,192,0.25)" }}>📅 Book Appointment</button>
              <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" style={{ background:"#25d366", color:"white", borderRadius:10, padding:"14px 28px", fontSize:15, fontWeight:600, textDecoration:"none" }}>💬 WhatsApp</a>
              <a href={`tel:${clinic.phone}`} style={{ background:"transparent", color:"#1565c0", border:"1.5px solid #1565c0", borderRadius:10, padding:"13px 24px", fontSize:15, fontWeight:600, textDecoration:"none" }}>📞 Call</a>
            </div>
            {/* Factual stats — no ratings or superlatives */}
            <div style={{ display:"flex", gap:32 }}>
              {[
                doctor?.experience && [doctor.experience, "Clinical Experience"],
                services.filter(s=>s.is_active).length > 0 && [`${services.filter(s=>s.is_active).length}+`, "Services Available"],
                doctor?.reg_number && ["Registered", clinic.city + " Medical Council"],
              ].filter(Boolean).map(([n,l])=>(
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
              {[["Full Name","Your name"],["Phone","98400 00000"]].map(([l,p])=>(
                <div key={l} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginBottom:5, fontWeight:600 }}>{l.toUpperCase()}</div>
                  <input placeholder={p} style={{ width:"100%", background:"#f4f8fd", border:"1.5px solid #dce8f5", borderRadius:8, padding:"10px 12px", fontSize:14, color:"#0b2545", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginBottom:5, fontWeight:600 }}>SERVICE</div>
                <select style={{ width:"100%", background:"#f4f8fd", border:"1.5px solid #dce8f5", borderRadius:8, padding:"10px 12px", fontSize:14, color:"#0b2545", fontFamily:"inherit", outline:"none" }}>
                  {services.filter(s=>s.is_active).map(s=><option key={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={()=>setShowBook(true)} style={{ width:"100%", background:"linear-gradient(135deg,#1565c0,#1e88e5)", color:"white", border:"none", borderRadius:8, padding:"13px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                Check Available Slots →
              </button>
              <div style={{ fontSize:10, color:"#94a3b8", textAlign:"center", marginTop:10 }}>
                🔒 Your data is protected under DPDP Act, 2023
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding:"80px 40px", background:"#f4f8fd" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <Reveal>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>Our Services</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(26px,3vw,36px)", color:"#0b2545", marginBottom:14 }}>Clinical Services</h2>
            <p style={{ fontSize:15, color:"#5a7a96", maxWidth:480, lineHeight:1.6, marginBottom:48 }}>Evidence-based treatments delivered by qualified specialists.</p>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {services.filter(s=>s.is_active).map((svc,i)=>(
              <Reveal key={svc.id||i} delay={i*.06}>
                <div style={{ background:"white", borderRadius:14, padding:"22px 18px", border:"1px solid #dce8f5", transition:"all .25s", cursor:"pointer" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 32px rgba(11,37,69,0.1)"}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                  <div style={{ fontSize:28, marginBottom:12 }}>{svc.icon||"🏥"}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#0b2545", marginBottom:6 }}>{svc.name}</div>
                  <div style={{ fontSize:12, color:"#5a7a96", lineHeight:1.5, marginBottom:10 }}>{svc.description||"Professional clinical care."}</div>
                  {/* Compliant pricing — flat fee, no "Starting" */}
                  {svc.price&&<div style={{ fontSize:13, fontWeight:600, color:"#1565c0" }}>Consultation fee: {svc.price}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCTOR ── */}
      {doctor&&(
        <section id="doctor" style={{ padding:"80px 40px", background:"white" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:60, alignItems:"center" }}>
            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:20, background:"linear-gradient(160deg,#e3f2fd,#c8e6fa)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                {doctor.photo_url
                  ? <img src={doctor.photo_url} alt={`${doctor.name}, ${doctor.degree}`} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontSize:100 }}>👨‍⚕️</span>}
                <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", background:"white", borderRadius:12, padding:"10px 18px", boxShadow:"0 8px 24px rgba(11,37,69,0.12)", display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:"#22c55e" }}/>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0b2545" }}>Accepting Patients</span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={.15}>
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>Your Doctor</div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, color:"#0b2545", marginBottom:6 }}>{doctor.name}</h2>
              <div style={{ color:"#1565c0", fontWeight:600, fontSize:15, marginBottom:6 }}>{doctor.degree}</div>
              {/* Mandatory Reg No display */}
              {doctor.reg_number&&(
                <div style={{ fontSize:12, color:"#94a3b8", marginBottom:20, fontFamily:"monospace" }}>
                  Reg No: {doctor.reg_number} — {doctor.council_name||"Medical Council"}
                </div>
              )}
              <p style={{ color:"#5a7a96", lineHeight:1.8, fontSize:15, marginBottom:28 }}>{doctor.bio}</p>
              {[
                ["🎓", doctor.degree, "Qualification"],
                ["🔬", doctor.specialization||clinic.specialty, "Specialization"],
                doctor.experience&&["📅", doctor.experience+" of Practice", "Experience"],
              ].filter(Boolean).map(([icon,title,sub])=>(
                <div key={sub} style={{ display:"flex", gap:12, marginBottom:14, alignItems:"flex-start" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"#e3f2fd", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:14, color:"#0b2545", fontWeight:500 }}>{title}</div>
                    <div style={{ fontSize:12, color:"#94a3b8" }}>{sub}</div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setShowBook(true)} style={{ marginTop:8, background:"#1565c0", color:"white", border:"none", borderRadius:10, padding:"14px 28px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── FACILITY (replaces reviews — compliance fix B1/B3) ── */}
      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ── FAQ ── */}
      <FAQSection specialty={clinic.specialty} city={clinic.city}/>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding:"80px 40px", background:"#f4f8fd" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60 }}>
          <Reveal>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#1565c0", marginBottom:10 }}>Find Us</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, color:"#0b2545", marginBottom:32 }}>Visit {clinic.name}</h2>
            {[
              ["📍","Address", clinic.address||`${clinic.city}, Tamil Nadu`],
              ["📞","Phone",   clinic.phone],
              ["💬","WhatsApp",clinic.whatsapp||clinic.phone],
              ["✉️","Email",   clinic.email],
            ].filter(([,, v])=>v).map(([icon,label,value])=>(
              <div key={label} style={{ display:"flex", gap:16, marginBottom:24, alignItems:"flex-start" }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"#e3f2fd", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:.5, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:15, color:"#0b2545", fontWeight:500 }}>{value}</div>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal delay={.15}>
            <div style={{ background:"#f0f7ff", borderRadius:16, padding:28, border:"1px solid #dce8f5" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0b2545", marginBottom:16 }}>Working Hours</div>
              {[["Monday – Friday","9:00 AM – 8:00 PM",true],["Saturday","9:00 AM – 6:00 PM",true],["Sunday","Closed",false]].map(([day,hours,open])=>(
                <div key={day} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #dce8f5", fontSize:14 }}>
                  <span style={{ color:"#5a7a96" }}>{day}</span>
                  <span style={{ fontWeight:600, color:open?"#22c55e":"#ef4444" }}>{hours}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" style={{ flex:1, background:"#25d366", color:"white", borderRadius:10, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>💬 WhatsApp</a>
                <a href={`tel:${clinic.phone}`} style={{ flex:1, background:"#1565c0", color:"white", borderRadius:10, padding:"12px", textAlign:"center", fontSize:13, fontWeight:600, textDecoration:"none" }}>📞 Call Now</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER (compliance fix D1 — Reg No mandatory) ── */}
      <ClinicFooter clinic={clinic} doctor={doctor}/>

      {/* Floating actions */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp||clinic.phone||"").replace(/\D/g,"")}`} target="_blank" style={{ width:50, height:50, borderRadius:"50%", background:"#25d366", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none", boxShadow:"0 4px 16px rgba(37,211,102,0.4)" }}>💬</a>
        <a href={`tel:${clinic.phone}`} style={{ width:50, height:50, borderRadius:"50%", background:"#1565c0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, textDecoration:"none", boxShadow:"0 4px 16px rgba(21,101,192,0.4)" }}>📞</a>
      </div>

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}`}</style>
    </div>
  );
}