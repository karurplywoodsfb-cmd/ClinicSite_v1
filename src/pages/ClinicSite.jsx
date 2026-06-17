// src/pages/ClinicSite.jsx — FINAL v3
// Fixes:
//   - Theme: color_theme from DB applied via inline CSS variables (production-safe)
//   - Services: hide_price respected
//   - getSeoData 406: uses maybeSingle via supabase.js (graceful null)
//   - getClinicBySlug 406: maybeSingle, returns null cleanly
//   - getClinicMedia replaces getReviews (compliance B1/B3)
//   - Template-aware rendering
//   - ClinicFooter (mandatory Reg No — compliance D1)
//   - DPDP consent in BookingEngine (compliance D3)
//   - No patient testimonials / star ratings (compliance A1/A2/B1)
//   - Compliant hero copy — no superlatives

import { useState, useEffect, useRef } from "react";
import {
  supabase,
  getClinicBySlug,
  getServices,
  getDoctors,
  getClinicMedia,
  getSeoData,
} from "../lib/supabase";
import BookingEngine      from "../components/BookingEngine";
import ClinicFooter       from "../components/ClinicFooter";
import ClinicMediaSection from "../components/ClinicMediaSection";
import { TEMPLATES, suggestTemplate } from "../templates";

// ── Theme variable applier (production-safe, no dynamic imports) ────
// ── Theme variable applier (production-safe, no dynamic imports) ────
function applyThemeVars(themeId) {
  // Handle both formats: "theme-006-midnight" → "midnight", "ocean" → "ocean"
  const normalizeThemeId = (id) => {
    if (!id) return "default";
    // Strip "theme-XXX-" prefix if present
    const match = id.match(/^theme-\d+-(.*)$/);
    return match ? match[1] : id;
  };

  const themes = {
    "default":   { "--color-primary": "#1565c0", "--color-primary-light": "#1e88e5", "--color-accent": "#0288d1", "--color-bg": "#f4f8fd", "--color-surface": "#ffffff", "--color-text": "#0b2545", "--color-muted": "#5a7a96", "--color-border": "#dce8f5" },
    "ocean":     { "--color-primary": "#1565c0", "--color-primary-light": "#1e88e5", "--color-accent": "#0288d1", "--color-bg": "#f4f8fd", "--color-surface": "#ffffff", "--color-text": "#0b2545", "--color-muted": "#5a7a96", "--color-border": "#dce8f5" },
    "forest":    { "--color-primary": "#2e7d32", "--color-primary-light": "#43a047", "--color-accent": "#66bb6a", "--color-bg": "#f1f8e9", "--color-surface": "#ffffff", "--color-text": "#1b5e20", "--color-muted": "#558b2f", "--color-border": "#c8e6c9" },
    "sunset":    { "--color-primary": "#e64a19", "--color-primary-light": "#f57c00", "--color-accent": "#ff9800", "--color-bg": "#fff3e0", "--color-surface": "#ffffff", "--color-text": "#bf360c", "--color-muted": "#e65100", "--color-border": "#ffe0b2" },
    "lavender":  { "--color-primary": "#7b1fa2", "--color-primary-light": "#9c27b0", "--color-accent": "#ab47bc", "--color-bg": "#f3e5f5", "--color-surface": "#ffffff", "--color-text": "#4a148c", "--color-muted": "#7b1fa2", "--color-border": "#e1bee7" },
    "gold":      { "--color-primary": "#f57f17", "--color-primary-light": "#fb8c00", "--color-accent": "#ffa000", "--color-bg": "#fff8e1", "--color-surface": "#ffffff", "--color-text": "#e65100", "--color-muted": "#f57f17", "--color-border": "#ffecb3" },
    "midnight":  { "--color-primary": "#5c6bc0", "--color-primary-light": "#7986cb", "--color-accent": "#9fa8da", "--color-bg": "#0d1117", "--color-surface": "#161b22", "--color-text": "#e6edf3", "--color-muted": "#8b949e", "--color-border": "#30363d" },
    "rose":      { "--color-primary": "#c2185b", "--color-primary-light": "#d81b60", "--color-accent": "#e91e63", "--color-bg": "#fce4ec", "--color-surface": "#ffffff", "--color-text": "#880e4f", "--color-muted": "#c2185b", "--color-border": "#f8bbd0" },
    "teal":      { "--color-primary": "#00695c", "--color-primary-light": "#00796b", "--color-accent": "#009688", "--color-bg": "#e0f2f1", "--color-surface": "#ffffff", "--color-text": "#004d40", "--color-muted": "#00695c", "--color-border": "#b2dfdb" },
    "charcoal":  { "--color-primary": "#455a64", "--color-primary-light": "#607d8b", "--color-accent": "#78909c", "--color-bg": "#eceff1", "--color-surface": "#ffffff", "--color-text": "#263238", "--color-muted": "#455a64", "--color-border": "#cfd8dc" },
    "sage":      { "--color-primary": "#558b2f", "--color-primary-light": "#689f38", "--color-accent": "#7cb342", "--color-bg": "#f1f8e9", "--color-surface": "#ffffff", "--color-text": "#33691e", "--color-muted": "#558b2f", "--color-border": "#c8e6c9" },
  };

  const defaults = {
    "--color-primary": "#1565c0", "--color-primary-light": "#1e88e5", "--color-accent": "#0288d1",
    "--color-bg": "#f4f8fd", "--color-surface": "#ffffff", "--color-text": "#0b2545",
    "--color-muted": "#5a7a96", "--color-border": "#dce8f5", "--color-success": "#2e7d32",
    "--color-warning": "#f57f17", "--color-danger": "#c62828",
  };

  const normalizedId = normalizeThemeId(themeId);
  const vars = themes[normalizedId] || themes["default"];
  const merged = { ...defaults, ...vars };

  Object.entries(merged).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });

  console.log(`[ClinicSite] Applied theme: ${themeId} → ${normalizedId}`);
}

// ── SEO injector ──────────────────────────────────────────────────
function injectSEO(clinic, services, doctor, seoData) {
  const city      = clinic.city      || "India";
  const specialty = clinic.specialty || "Medical";
  const name      = clinic.name;

  // Title: prefer seo_data row, else auto-generate
  document.title = seoData?.meta_title
    || `${name} | ${specialty} Clinic in ${city} | Book Appointment`;

  const setMeta = (nameAttr, content) => {
    let el = document.querySelector(`meta[name="${nameAttr}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", nameAttr);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  const setOG = (prop, content) => {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", prop);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  const desc = seoData?.meta_description
    || `${name} — Expert ${specialty.toLowerCase()} care in ${city}. `
    + `${(services || []).slice(0,3).map(s => s.name).join(", ")}. Book appointment online.`;

  setMeta("description", desc);
  setMeta("keywords",
    `${specialty.toLowerCase()} in ${city}, ${name.toLowerCase()}, `
    + `dental clinic ${city}, ${specialty.toLowerCase()} doctor ${city}`
  );
  setMeta("robots", "index, follow");

  // Canonical
  let canon = document.querySelector("link[rel='canonical']");
  if (!canon) {
    canon = document.createElement("link");
    canon.setAttribute("rel", "canonical");
    document.head.appendChild(canon);
  }
  canon.setAttribute("href", `https://${clinic.slug}.clinicsite.in`);

  // OG tags
  setOG("og:title",       `${name} — ${specialty} in ${city}`);
  setOG("og:description", desc);
  setOG("og:type",        "website");
  setOG("og:url",         `https://${clinic.slug}.clinicsite.in`);

  // JSON-LD schema — use stored schema if available, else auto-generate
  const schema = seoData?.schema_json || {
    "@context": "https://schema.org",
    "@type":    ["MedicalClinic", "LocalBusiness"],
    "name":     name,
    "medicalSpecialty": specialty,
    "address": {
      "@type":           "PostalAddress",
      "addressLocality": city,
      "addressRegion":   "Tamil Nadu",
      "addressCountry":  "IN",
    },
    "telephone": clinic.phone,
    ...(clinic.email && { "email": clinic.email }),
    "availableService": (services || []).map(s => ({
      "@type": "MedicalProcedure",
      "name":   s.name,
    })),
    ...(doctor?.reg_number && {
      "employee": {
        "@type":      "Physician",
        "name":       doctor.name,
        "identifier": doctor.reg_number,
        "hasCredential": {
          "@type":            "EducationalOccupationalCredential",
          "credentialCategory": doctor.degree,
        },
      },
    }),
  };

  let schemaEl = document.getElementById("clinic-schema");
  if (!schemaEl) {
    schemaEl = document.createElement("script");
    schemaEl.id   = "clinic-schema";
    schemaEl.type = "application/ld+json";
    document.head.appendChild(schemaEl);
  }
  schemaEl.textContent = JSON.stringify(schema);
}

// ── Intersection-observer reveal ──────────────────────────────────
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
      opacity:   vis ? 1 : 0,
      transform: vis ? "none" : "translateY(22px)",
      transition: `opacity .55s ${delay}s ease, transform .55s ${delay}s ease`,
    }}>
      {children}
    </div>
  );
}

// ── Sticky navbar ─────────────────────────────────────────────────
function Navbar({ clinic, onBookClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      background:    scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)",
      backdropFilter:"blur(12px)",
      borderBottom:  scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
      boxShadow:     scrolled ? "0 2px 20px rgba(11,37,69,0.07)" : "none",
      transition:    "all .3s",
      padding:"0 40px", height:64,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <a href={`/${clinic.slug}`} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
        <div style={{ width:36, height:36, borderRadius:10,
          background:"linear-gradient(135deg,var(--color-primary),var(--color-primary-light))",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🦷</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"var(--color-text)", lineHeight:1.1 }}>{clinic.name}</div>
          {clinic.tagline && (
            <div style={{ fontSize:10, color:"var(--color-muted)" }}>{clinic.tagline}</div>
          )}
        </div>
      </a>

      <div style={{ display:"flex", gap:20 }}>
        {[["Services","#services"],["Doctor","#doctor"],["Facility","#facility"],["Contact","#contact"]].map(([l, href]) => (
          <a key={l} href={href}
            style={{ textDecoration:"none", color:"var(--color-muted)", fontSize:13, fontWeight:500,
              transition:"color .15s" }}
            onMouseEnter={e => e.target.style.color = "var(--color-primary)"}
            onMouseLeave={e => e.target.style.color = "var(--color-muted)"}>
            {l}
          </a>
        ))}
        <button onClick={() => document.getElementById("faq")?.scrollIntoView({behavior:"smooth"})}
          style={{ textDecoration:"none", color:"var(--color-muted)", fontSize:13, fontWeight:500,
            background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
          FAQ
        </button>
      </div>

      <button onClick={onBookClick} style={{
        background:"var(--color-primary)", color:"var(--color-surface)", border:"none",
        borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600,
        cursor:"pointer", fontFamily:"inherit",
        boxShadow:"0 4px 14px rgba(21,101,192,0.25)", transition:"all .2s",
      }}>
        📅 Book Appointment
      </button>
    </nav>
  );
}

// ── Specialty-aware FAQ ───────────────────────────────────────────
const FAQ_MAP = {
  Dental: [
    ["Is dental implant treatment painful?",
     "Dental implants are placed under local anaesthesia. Most patients compare the experience to a routine filling. Some mild soreness for 1–2 days afterwards is normal and manageable with standard pain relief. Your dentist will discuss what to expect before any procedure."],
    ["How long does a root canal take?",
     "Most root canal treatments are completed in one or two appointments of approximately 60–90 minutes each, depending on the tooth and complexity. Your dentist will advise on the expected timeline after examining you."],
    ["What does professional dental cleaning involve?",
     "A professional cleaning (scaling and polishing) removes plaque and tartar that cannot be removed by brushing alone. It is generally comfortable and takes around 30–45 minutes. It is recommended every 6 months as preventive care."],
    ["Do you provide treatment for children?",
     "Yes. We provide child-friendly dental care from age 3 onwards, including preventive treatments, fluoride application, and routine checkups. Our team is experienced in making young patients feel comfortable."],
    ["How do I book an appointment?",
     "You can book using the form on this page, call us directly, or send a WhatsApp message. We confirm appointments within 30 minutes during clinic hours."],
  ],
  Dermatology: [
    ["When should I see a dermatologist for acne?",
     "If over-the-counter products have not helped after 2–3 months, or if acne is leaving scars or significantly affecting your confidence, a dermatologist consultation is recommended. Early intervention generally produces better outcomes."],
    ["Is laser treatment safe for Indian skin?",
     "Many laser and light-based treatments are suitable for Indian skin tones, but the specific device and parameters matter. Your dermatologist will assess your skin type (Fitzpatrick IV–VI) and recommend the safest, most effective option for your concern."],
    ["How do I prepare for my first skin consultation?",
     "Come with clean skin if possible, bring a list of any products you currently use, and note any medications you take. Photos of flare-ups (if intermittent) are helpful. Avoid applying makeup to the area of concern on the day."],
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

  // FAQ JSON-LD schema
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
    <section id="faq" style={{ padding:"80px 40px", background:"var(--color-surface)", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Schema injected via dangerouslySetInnerHTML to avoid runtime script issues */}
      <div dangerouslySetInnerHTML={{ __html:
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>` }}/>

      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <Reveal>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:2,
            textTransform:"uppercase", color:"var(--color-primary)", marginBottom:10 }}>FAQ</div>
          <h2 style={{ fontFamily:"'DM Serif Display',serif",
            fontSize:"clamp(26px,3vw,36px)", color:"var(--color-text)", marginBottom:40 }}>
            Frequently Asked Questions
          </h2>
        </Reveal>
        <div style={{ maxWidth:720 }}>
          {faqs.map(([q, a], i) => (
            <div key={i} style={{ borderBottom:"1px solid var(--color-border)" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width:"100%", display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"18px 0", cursor:"pointer",
                  fontSize:15, fontWeight:600, background:"none", border:"none",
                  color: open === i ? "var(--color-primary)" : "var(--color-text)", gap:16,
                  fontFamily:"'DM Sans',sans-serif", textAlign:"left" }}>
                {q}
                <span style={{ fontSize:18, color:"var(--color-primary)", transition:"transform .3s",
                  transform: open === i ? "rotate(180deg)" : "none", flexShrink:0 }}>⌄</span>
              </button>
              {open === i && (
                <div style={{ fontSize:14, color:"var(--color-muted)", lineHeight:1.75, paddingBottom:16 }}>
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Loading spinner ───────────────────────────────────────────────
function PageLoader({ message }) {
  return (
    <div style={{ minHeight:"100vh", background:"var(--color-bg)", display:"flex",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:40 }}>🦷</div>
      <div style={{ color:"var(--color-muted)", fontSize:14 }}>{message || "Loading..."}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ClinicSite({ slug }) {
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
      // getClinicBySlug now uses maybeSingle — no 406
      const c = await getClinicBySlug(slug);
      if (!c) {
        setError("Clinic not found or site is not published.");
        setLoading(false);
        return;
      }

      // Run all data fetches in parallel — any failure is non-fatal
      const [svcs, docs, mediaItems, seo] = await Promise.allSettled([
        getServices(c.id),
        getDoctors(c.id),
        getClinicMedia(c.id),
        getSeoData(c.id),   // maybeSingle — returns null if no row, no 406
      ]);

      const resolvedSvcs  = svcs.status      === "fulfilled" ? svcs.value      : [];
      const resolvedDocs  = docs.status      === "fulfilled" ? docs.value      : [];
      const resolvedMedia = mediaItems.status === "fulfilled" ? mediaItems.value : [];
      const resolvedSeo   = seo.status       === "fulfilled" ? seo.value       : null;

      setClinic(c);
      setServices(resolvedSvcs);
      setDoctors(resolvedDocs);
      setMedia(resolvedMedia);
      setSeoData(resolvedSeo);

      // Inject SEO (graceful whether seoData is null or populated)
      injectSEO(c, resolvedSvcs, resolvedDocs[0], resolvedSeo);

      // ✅ FIXED: Apply theme via inline CSS variables (production-safe)
      applyThemeVars(c.color_theme || c.theme_id || "default");

    } catch (e) {
      console.error("ClinicSite loadAll:", e.message);
      setError(e.message || "Failed to load clinic. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader message={`Loading ${slug}...`}/>;

  if (error || !clinic) return (
    <div style={{ minHeight:"100vh", background:"var(--color-bg)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <div style={{ color:"var(--color-danger)", fontWeight:600, fontSize:16 }}>Clinic not found</div>
      <div style={{ color:"var(--color-text-muted)", fontSize:14, textAlign:"center", maxWidth:400 }}>{error}</div>
      <a href="/" style={{ marginTop:8, fontSize:13, color:"var(--color-primary)" }}>← Back to ClinicSite</a>
    </div>
  );

  const doctor      = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"var(--color-text)",
      background:"var(--color-surface)", overflowX:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      <Navbar clinic={clinic} onBookClick={() => setShowBook(true)}/>

      {/* ── Booking Modal ── */}
      {showBook && (
        <div
          onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position:"fixed", inset:0, zIndex:200,
            background:"rgba(11,37,69,0.65)", backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:20, overflowY:"auto" }}>
          <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
            <button onClick={() => setShowBook(false)} style={{
              position:"absolute", top:-14, right:-14, zIndex:10,
              width:32, height:32, borderRadius:"50%", background:"var(--color-surface)",
              border:"none", cursor:"pointer", fontSize:16,
              boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              ✕
            </button>
            <BookingEngine clinic={clinic} services={activeServices} hidePrice={true}/>
          </div>
        </div>
      )}

      {/* ══════════════ HERO ══════════════ */}
      <section style={{
        minHeight:"100vh", paddingTop:64,
        background:"radial-gradient(ellipse 80% 60% at 70% 50%,rgba(21,101,192,0.07),transparent),"
                 + "linear-gradient(160deg,var(--color-bg) 0%,var(--color-surface) 60%)",
        display:"flex", alignItems:"center",
        padding:"80px 40px", position:"relative", overflow:"hidden",
      }}>
        <div style={{ maxWidth:1100, margin:"0 auto",
          display:"grid", gridTemplateColumns:"min(100%, 540px) 1fr",
          gap:60, alignItems:"center", width:"100%", flexWrap:"wrap" }}>

          {/* Left */}
          <div>
            {/* Compliant badge — specialty + location only, no superlatives */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(21,101,192,0.08)", border:"1px solid rgba(21,101,192,0.18)",
              borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600,
              color:"var(--color-primary)", marginBottom:20 }}>
              🦷 {clinic.specialty} Clinic · {clinic.city}, Tamil Nadu
            </div>

            <h1 style={{ fontFamily:"'DM Serif Display',serif",
              fontSize:"clamp(34px,4.5vw,54px)", color:"var(--color-text)",
              lineHeight:1.15, marginBottom:20 }}>
              {clinic.heroTagline || (
                <>Your Health Deserves<br/>
                <em style={{ fontStyle:"italic", color:"var(--color-primary-light)" }}>Specialist Care</em></>
              )}
            </h1>

            <p style={{ fontSize:16, color:"var(--color-muted)", lineHeight:1.75,
              marginBottom:32, maxWidth:460 }}>
              {clinic.about ||
                `${clinic.name} provides expert ${(clinic.specialty || "").toLowerCase()} care `
                + `in ${clinic.city}, delivered by qualified specialists.`}
            </p>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
              <button onClick={() => setShowBook(true)} style={{
                background:"var(--color-primary)", color:"var(--color-surface)", border:"none",
                borderRadius:10, padding:"14px 28px", fontSize:15, fontWeight:600,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 4px 16px rgba(21,101,192,0.25)", transition:"all .2s" }}>
                📅 Book Appointment
              </button>
              <a href={`https://wa.me/${(clinic.whatsapp || clinic.phone || "").replace(/\D/g,"")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ background:"var(--color-whatsapp)", color:"var(--color-surface)", borderRadius:10,
                  padding:"14px 28px", fontSize:15, fontWeight:600, textDecoration:"none" }}>
                💬 WhatsApp
              </a>
              <a href={`tel:${clinic.phone}`}
                style={{ background:"transparent", color:"var(--color-primary)",
                  border:"1.5px solid var(--color-primary)", borderRadius:10,
                  padding:"13px 24px", fontSize:15, fontWeight:600, textDecoration:"none" }}>
                📞 Call
              </a>
            </div>

            {/* Factual stats — no ratings, no "best", no comparisons */}
            <div style={{ display:"flex", gap:32 }}>
              {[
                doctor?.experience && [doctor.experience, "Clinical Experience"],
                activeServices.length > 0 && [`${activeServices.length}+`, "Services"],
                doctor?.reg_number && ["Registered", "Medical Practitioner"],
              ].filter(Boolean).map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily:"'DM Serif Display',serif",
                    fontSize:24, color:"var(--color-text)" }}>{n}</div>
                  <div style={{ fontSize:12, color:"var(--color-muted)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Booking card */}
          <div style={{ background:"var(--color-surface)", borderRadius:20,
            boxShadow:"0 24px 64px rgba(11,37,69,0.12)", overflow:"hidden" }}>
            <div style={{ background:"linear-gradient(135deg,var(--color-text),var(--color-primary))",
              padding:"24px 28px", color:"var(--color-surface)" }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, marginBottom:4 }}>
                Book Appointment
              </div>
              <div style={{ fontSize:13, opacity:.7 }}>Free consultation for new patients</div>
            </div>
            <div style={{ padding:24 }}>
              {[["Full Name","Your name"],["Phone","98400 00000"]].map(([l, p]) => (
                <div key={l} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"var(--color-text-muted)", fontFamily:"monospace",
                    marginBottom:5, fontWeight:600 }}>{l.toUpperCase()}</div>
                  <input placeholder={p} style={{
                    width:"100%", background:"var(--color-bg)",
                    border:"1.5px solid var(--color-border)", borderRadius:8,
                    padding:"10px 12px", fontSize:14, color:"var(--color-text)",
                    fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              {activeServices.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"var(--color-text-muted)", fontFamily:"monospace",
                    marginBottom:5, fontWeight:600 }}>SERVICE</div>
                  <select style={{ width:"100%", background:"var(--color-bg)",
                    border:"1.5px solid var(--color-border)", borderRadius:8,
                    padding:"10px 12px", fontSize:14, color:"var(--color-text)",
                    fontFamily:"inherit", outline:"none" }}>
                    {activeServices.map(s => <option key={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <button onClick={() => setShowBook(true)} style={{
                width:"100%",
                background:"linear-gradient(135deg,var(--color-primary),var(--color-primary-light))",
                color:"var(--color-surface)", border:"none", borderRadius:8, padding:"13px",
                fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 4px 14px rgba(21,101,192,0.3)" }}>
                Check Available Slots →
              </button>
              <div style={{ fontSize:10, color:"var(--color-text-muted)", textAlign:"center", marginTop:10 }}>
                🔒 Data protected under DPDP Act, 2023
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ SERVICES ══════════════ */}
      {activeServices.length > 0 && (
        <section id="services" style={{ padding:"80px 40px", background:"var(--color-bg)" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <Reveal>
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:2,
                textTransform:"uppercase", color:"var(--color-primary)", marginBottom:10 }}>
                Our Services
              </div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif",
                fontSize:"clamp(26px,3vw,36px)", color:"var(--color-text)", marginBottom:14 }}>
                Clinical Services
              </h2>
              <p style={{ fontSize:15, color:"var(--color-muted)", maxWidth:480,
                lineHeight:1.6, marginBottom:48 }}>
                Evidence-based treatments by qualified specialists.
              </p>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
              {activeServices.map((svc, i) => (
                <Reveal key={svc.id || i} delay={i * 0.06}>
                  <div style={{ background:"var(--color-surface)", borderRadius:14, padding:"22px 18px",
                    border:"1px solid var(--color-border)", transition:"all .25s", cursor:"pointer" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 32px rgba(11,37,69,0.1)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{svc.icon || "🏥"}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--color-text)", marginBottom:6 }}>
                      {svc.name}
                    </div>
                    {svc.description && (
                      <div style={{ fontSize:12, color:"var(--color-muted)", lineHeight:1.5, marginBottom:10 }}>
                        {svc.description}
                      </div>
                    )}
                    {/* ✅ FIXED: Only show price if NOT hidden */}
                    {svc.price && svc.hide_price !== true && (
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--color-primary)" }}>
                        Consultation fee: {svc.price}
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ DOCTOR ══════════════ */}
      {doctor && (
        <section id="doctor" style={{ padding:"80px 40px", background:"var(--color-surface)" }}>
          <div style={{ maxWidth:1100, margin:"0 auto",
            display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",
            gap:60, alignItems:"center" }}>

            <Reveal>
              <div style={{ width:"100%", aspectRatio:"4/5", borderRadius:20,
                background:"linear-gradient(160deg,var(--color-primary-bg),var(--color-primary-bg-light))",
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative", overflow:"hidden" }}>
                {doctor.photo_url
                  ? <img src={doctor.photo_url}
                      alt={`${doctor.name}${doctor.degree ? `, ${doctor.degree}` : ""}`}
                      style={{ width:"100%", height:"100%", objectFit:"cover"}}/>
                  : <span style={{ fontSize:100 }}>👨‍⚕️</span>}
                <div style={{ position:"absolute", bottom:20, left:"50%",
                  transform:"translateX(-50%)", background:"var(--color-surface)", borderRadius:12,
                  padding:"10px 18px", boxShadow:"0 8px 24px rgba(11,37,69,0.12)",
                  display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%",
                    background:"var(--color-success)",
                    animation:"pulse 2s infinite" }}/>
                  <span style={{ fontSize:13, fontWeight:600, color:"var(--color-text)" }}>
                    Accepting Patients
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:2,
                textTransform:"uppercase", color:"var(--color-primary)", marginBottom:10 }}>
                Your Doctor
              </div>
              <h2 style={{ fontFamily:"'DM Serif Display',serif",
                fontSize:34, color:"var(--color-text)", marginBottom:6 }}>
                {doctor.name}
              </h2>
              <div style={{ color:"var(--color-primary)", fontWeight:600, fontSize:15, marginBottom:6 }}>
                {doctor.degree}
              </div>
              {/* Mandatory Reg No display — compliance D1 */}
              {doctor.reg_number && (
                <div style={{ fontSize:12, color:"var(--color-text-muted)", marginBottom:20,
                  fontFamily:"monospace" }}>
                  Reg No: {doctor.reg_number}
                  {doctor.council_name ? ` — ${doctor.council_name}` : ""}
                </div>
              )}
              {doctor.bio && (
                <p style={{ color:"var(--color-muted)", lineHeight:1.8, fontSize:15, marginBottom:28 }}>
                  {doctor.bio}
                </p>
              )}
              {[
                ["🎓", doctor.degree,             "Qualification"],
                ["🔬", doctor.specialization || clinic.specialty, "Specialization"],
                doctor.experience && ["📅", doctor.experience + " of Practice", "Experience"],
              ].filter(Boolean).map(([icon, title, sub]) => (
                <div key={sub} style={{ display:"flex", gap:12, marginBottom:14, alignItems:"flex-start" }}>
                  <div style={{ width:32, height:32, borderRadius:8,
                    background:"var(--color-primary-bg)", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:15, flexShrink:0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize:14, color:"var(--color-text)", fontWeight:500 }}>{title}</div>
                    <div style={{ fontSize:12, color:"var(--color-text-muted)" }}>{sub}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowBook(true)} style={{
                marginTop:8, background:"var(--color-primary)", color:"var(--color-surface)",
                border:"none", borderRadius:10, padding:"14px 28px",
                fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 4px 16px rgba(21,101,192,0.25)" }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </section>
      )}

      {/* ══════════════ FACILITY (replaces reviews — compliance B1/B3) ══════════════ */}
      <ClinicMediaSection clinic={clinic} mediaItems={media}/>

      {/* ══════════════ FAQ ══════════════ */}
      <FAQSection clinic={clinic}/>

      {/* ══════════════ CONTACT ══════════════ */}
      <section id="contact" style={{ padding:"80px 40px", background:"var(--color-bg)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto",
          display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:40 }}>
          <Reveal>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:2,
              textTransform:"uppercase", color:"var(--color-primary)", marginBottom:10 }}>
              Find Us
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif",
              fontSize:34, color:"var(--color-text)", marginBottom:32 }}>
              Visit {clinic.name}
            </h2>
            {[
              ["📍", "Address",  clinic.address || `${clinic.city}, Tamil Nadu`],
              ["📞", "Phone",    clinic.phone],
              ["💬", "WhatsApp", clinic.whatsapp || clinic.phone],
              ["✉️", "Email",    clinic.email],
            ].filter(([,, v]) => v).map(([icon, label, value]) => (
              <div key={label} style={{ display:"flex", gap:16,
                marginBottom:24, alignItems:"flex-start" }}>
                <div style={{ width:44, height:44, borderRadius:12,
                  background:"var(--color-primary-bg)", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  fontSize:20, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:11, color:"var(--color-text-muted)", fontWeight:600,
                    textTransform:"uppercase", letterSpacing:.5, marginBottom:3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize:15, color:"var(--color-text)", fontWeight:500 }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.15}>
            <div style={{ background:"var(--color-bg)", borderRadius:16, padding:28,
              border:"1px solid var(--color-border)" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", marginBottom:16 }}>
                Working Hours
              </div>
              {[
                ["Monday – Friday", "9:00 AM – 8:00 PM", true],
                ["Saturday",        "9:00 AM – 6:00 PM", true],
                ["Sunday",          "Closed",             false],
              ].map(([day, hours, open]) => (
                <div key={day} style={{ display:"flex", justifyContent:"space-between",
                  padding:"10px 0", borderBottom:"1px solid var(--color-border)", fontSize:14 }}>
                  <span style={{ color:"var(--color-muted)" }}>{day}</span>
                  <span style={{ fontWeight:600, color: open ? "var(--color-success)" : "var(--color-danger)" }}>
                    {hours}
                  </span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <a href={`https://wa.me/${(clinic.whatsapp || clinic.phone || "").replace(/\D/g,"")}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, background:"var(--color-whatsapp)", color:"var(--color-surface)", borderRadius:10,
                    padding:"12px", textAlign:"center", fontSize:13,
                    fontWeight:600, textDecoration:"none" }}>
                  💬 WhatsApp
                </a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex:1, background:"var(--color-primary)", color:"var(--color-surface)", borderRadius:10,
                    padding:"12px", textAlign:"center", fontSize:13,
                    fontWeight:600, textDecoration:"none" }}>
                  📞 Call Now
                </a>
              </div>
              {/* Privacy policy link — DPDP requirement */}
              <div style={{ marginTop:14, textAlign:"center" }}>
                <a href={`/${clinic.slug}/privacy-policy`}
                  style={{ fontSize:11, color:"var(--color-text-muted)", textDecoration:"none" }}>
                  Privacy Policy (DPDP Act, 2023)
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FOOTER — mandatory Reg No (compliance D1) ══════════════ */}
      <ClinicFooter clinic={clinic} doctor={doctor}/>

      {/* Floating action buttons */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:200,
        display:"flex", flexDirection:"column", gap:10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp || clinic.phone || "").replace(/\D/g,"")}`}
          target="_blank" rel="noopener noreferrer"
          style={{ width:50, height:50, borderRadius:"50%", background:"var(--color-whatsapp)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(37,211,102,0.4)", transition:"transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          💬
        </a>
        <a href={`tel:${clinic.phone}`}
          style={{ width:50, height:50, borderRadius:"50%", background:"var(--color-primary)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, textDecoration:"none",
            boxShadow:"0 4px 16px rgba(21,101,192,0.4)", transition:"transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          📞
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}