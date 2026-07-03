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
  getWorkingHours,
} from "../lib/supabase";
import BookingEngine         from "../components/BookingEngine";
import ClinicFooter          from "../components/ClinicFooter";
import ClinicMediaSection    from "../components/ClinicMediaSection";
import WorkingHoursDisplay   from "../components/WorkingHoursDisplay";
import { TEMPLATES, suggestTemplate } from "../templates";
import { applyTheme }                  from "../lib/themes";

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
      padding:"0 24px", height:64,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <a href={`/${clinic.slug}`} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
        <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {clinic.logo_url
            ? <img src={clinic.logo_url} alt={clinic.name}
                style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
            : <div style={{ width:36, height:36, borderRadius:8,
                background:"linear-gradient(135deg,var(--color-primary),var(--color-primary-light))",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"white", fontSize:15, fontWeight:700 }}>
                {(clinic.name||"C").charAt(0).toUpperCase()}
              </div>
          }
        </div>
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
    <section id="faq" style={{ padding:"80px 24px", background:"var(--color-surface)", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Schema injected via dangerouslySetInnerHTML to avoid runtime script issues */}
      <div dangerouslySetInnerHTML={{ __html:
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>` }}/>

      <div style={{ width:"100%" }}>
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
  const [hours,    setHours]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

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
      const [svcs, docs, mediaItems, seo, hrs] = await Promise.allSettled([
        getServices(c.id),
        getDoctors(c.id),
        getClinicMedia(c.id),
        getSeoData(c.id),
        getWorkingHours(c.id),
      ]);

      const resolvedSvcs  = svcs.status      === "fulfilled" ? svcs.value      : [];
      const resolvedDocs  = docs.status      === "fulfilled" ? docs.value      : [];
      const resolvedMedia = mediaItems.status === "fulfilled" ? mediaItems.value : [];
      const resolvedSeo   = seo.status       === "fulfilled" ? seo.value       : null;
      const resolvedHrs   = hrs.status       === "fulfilled" ? hrs.value       : [];

      setClinic(c);
      setServices(resolvedSvcs);
      setDoctors(resolvedDocs);
      setMedia(resolvedMedia);
      setSeoData(resolvedSeo);
      setHours(resolvedHrs);

      // Inject SEO (graceful whether seoData is null or populated)
      injectSEO(c, resolvedSvcs, resolvedDocs[0], resolvedSeo);

      // Apply theme via inline CSS variables (production-safe)
      applyTheme(c.color_theme || c.theme_id || "default");

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

  const doctor         = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  // ── Template lookup — reads clinic.template from DB ──────────
  // Falls back to 'corporate' if not set or template not found
  const templateKey       = clinic.template || "corporate";
  const templateDef       = TEMPLATES[templateKey] || TEMPLATES["corporate"];
  const TemplateComponent = templateDef.component;

  return (
    <TemplateComponent
      clinic={clinic}
      services={activeServices}
      doctors={doctors}
      media={media}
      hours={hours}
      onBookClick={() => setShowBook && setShowBook(true)}
    />
  );
}