/* ═══════════════════════════════════════════════════════════════
   ClinicSite.jsx — FIXED v2

   Fixes:
   1. Accepts slug as PROP (Router.jsx passes it, not react-router useParams)
   2. Uses .maybeSingle() instead of .single() 
   3. Better error handling with visible debug info
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ThemeProvider from "../components/ThemeProvider";
import ClinicFooter from "../components/ClinicFooter";
import DPDPConsentBlock from "../components/DPDPConsentBlock";
import { usePushNotifications } from "../hooks/usePushNotifications";
import "./ClinicSite.css";

/* ── SVG Icons ── */
const Icons = {
  tooth: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.5 2.5 1 3.5.5 1 1 2 1 3.5 0 1.5-.5 3-1 4.5-.3.8-.5 1.5-.5 2 0 1.5 1 2.5 2.5 2.5.8 0 1.5-.5 2-1.2.3-.5.5-1 .5-1.5 0-.5.2-1 .5-1.5.3-.5.8-.8 1.5-.8s1.2.3 1.5.8c.3.5.5 1 .5 1.5 0 .5.2 1 .5 1.5.5.7 1.2 1.2 2 1.2 1.5 0 2.5-1 2.5-2.5 0-.5-.2-1.2-.5-2-.5-1.5-1-3-1-4.5 0-1.5.5-2.5 1-3.5.5-1 1-2 1-3.5 0-2.5-2.5-5-6-5z"/>
    </svg>
  ),
  bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  bellOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h13.09"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M2 2l20 20"/>
    </svg>
  ),
  mapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  whatsapp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════
   SECTION COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function NotificationBell({ clinicId }) {
  const { isSupported, isSubscribed, isDenied, loading, subscribe, unsubscribe } =
    usePushNotifications({ supabase, clinicId, type: "patient" });
  if (!isSupported) return null;
  return (
    <div className="cs-notification-wrapper">
      <button
        className={`cs-notification-btn ${isSubscribed ? "cs-active" : ""} ${isDenied ? "cs-denied" : ""}`}
        onClick={() => isSubscribed ? unsubscribe() : subscribe()}
        aria-label={isSubscribed ? "Unsubscribe" : "Subscribe to reminders"}
        disabled={loading || isDenied}
        title={isDenied ? "Blocked in browser settings" : isSubscribed ? "Click to unsubscribe" : "Get appointment reminders"}
      >
        {isSubscribed ? <Icons.bell /> : <Icons.bellOff />}
        {isSubscribed && <span className="cs-notification-dot" aria-hidden="true" />}
      </button>
    </div>
  );
}

function HeroSection({ clinic, doctor, activeServices, onBookClick }) {
  const stats = [
    doctor?.experience && [`${doctor.experience}+`, "Years Experience"],
    activeServices.length > 0 && [`${activeServices.length}`, "Services Offered"],
    doctor?.reg_number && ["Registered", "Medical Practitioner"],
  ].filter(Boolean);
  return (
    <section className="cs-hero" aria-label="Hero">
      <div className="cs-hero-inner">
        <div className="cs-hero-content">
          <div className="cs-badge">
            <Icons.tooth />
            <span>{clinic.specialty} Clinic · {clinic.city}, Tamil Nadu</span>
          </div>
          <h1 className="cs-hero-title">
            {clinic.heroTagline || <>Your Health Deserves <span className="cs-accent">Specialist Care</span></>}
          </h1>
          <p className="cs-hero-desc">
            {clinic.about || `${clinic.name} provides expert ${(clinic.specialty || "").toLowerCase()} care in ${clinic.city}, delivered by qualified specialists.`}
          </p>
          <div className="cs-hero-actions">
            {clinic.whatsapp && (
              <a href={`https://wa.me/91${clinic.whatsapp.replace(/\D/g, "")}`} className="cs-btn cs-btn-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                <Icons.whatsapp /> WhatsApp
              </a>
            )}
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="cs-btn cs-btn-outline" aria-label="Call clinic">
                <Icons.phone /> Call
              </a>
            )}
          </div>
          {stats.length > 0 && (
            <div className="cs-hero-stats">
              {stats.map(([n, l], i) => (
                <div key={i} className="cs-stat"><span className="cs-stat-num">{n}</span><span className="cs-stat-label">{l}</span></div>
              ))}
            </div>
          )}
        </div>
        <div className="cs-hero-card">
          <div className="cs-card-header"><h2>Book Appointment</h2><p>Free consultation for new patients</p></div>
          <form className="cs-booking-form" onSubmit={(e) => { e.preventDefault(); onBookClick(); }}>
            {[["Full Name", "Your name", "text"], ["Phone", "98400 00000", "tel"]].map(([l, p, t]) => (
              <label key={l} className="cs-field"><span>{l}</span><input type={t} placeholder={p} required aria-required="true" /></label>
            ))}
            {activeServices.length > 0 && (
              <label className="cs-field">
                <span>Service</span>
                <select required aria-required="true">
                  <option value="">Select a service</option>
                  {activeServices.map((s) => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                </select>
              </label>
            )}
            <button type="submit" className="cs-btn cs-btn-primary cs-btn-full">Book Now <Icons.arrowRight /></button>
          </form>
          <p className="cs-compliance-note"><Icons.shield /> Data protected under DPDP Act, 2023</p>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ services }) {
  if (services.length === 0) return null;
  return (
    <section className="cs-section cs-services" id="services" aria-label="Services">
      <div className="cs-container">
        <div className="cs-section-header">
          <span className="cs-section-tag">Our Services</span>
          <h2>Clinical Services</h2>
          <p>Evidence-based treatments by qualified specialists.</p>
        </div>
        <div className="cs-grid cs-grid-3">
          {services.map((svc) => (
            <article key={svc.id || svc.name} className="cs-service-card">
              <div className="cs-service-icon" aria-hidden="true">{svc.icon || "🏥"}</div>
              <h3>{svc.name}</h3>
              {svc.description && <p>{svc.description}</p>}
              {svc.price && <span className="cs-service-price">Consultation: {svc.price}</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DoctorSection({ doctor, clinic }) {
  if (!doctor) return null;
  const details = [
    ["🎓", doctor.degree, "Qualification"],
    ["🔬", doctor.specialization || clinic.specialty, "Specialization"],
    doctor.experience && ["📅", `${doctor.experience} Years`, "Experience"],
  ].filter(Boolean);
  return (
    <section className="cs-section cs-doctor" id="doctor" aria-label="Doctor Profile">
      <div className="cs-container">
        <div className="cs-doctor-grid">
          <div className="cs-doctor-photo">
            {doctor.photo_url ? <img src={doctor.photo_url} alt={`Dr. ${doctor.name}`} loading="lazy" /> : <div className="cs-doctor-avatar" aria-hidden="true">👨‍⚕️</div>}
            <span className="cs-doctor-badge">Accepting Patients</span>
          </div>
          <div className="cs-doctor-info">
            <span className="cs-section-tag">Your Doctor</span>
            <h2>Dr. {doctor.name}</h2>
            <p className="cs-doctor-degree">{doctor.degree}</p>
            {doctor.reg_number && (
              <div className="cs-reg-badge"><Icons.shield /><span>Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}</span></div>
            )}
            {doctor.bio && <p className="cs-doctor-bio">{doctor.bio}</p>}
            <div className="cs-doctor-details">
              {details.map(([icon, title, sub], i) => (
                <div key={i} className="cs-detail-item"><span className="cs-detail-icon" aria-hidden="true">{icon}</span><div><strong>{title}</strong><span>{sub}</span></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FacilitySection() {
  const features = [
    "Sterilised equipment as per NABH protocols",
    "Digital X-ray & OPG imaging",
    "Wheelchair accessible premises",
    "Emergency first-aid capability",
  ];
  return (
    <section className="cs-section cs-facility" id="facility" aria-label="Facility">
      <div className="cs-container">
        <div className="cs-section-header">
          <span className="cs-section-tag">Our Facility</span>
          <h2>Modern Clinical Infrastructure</h2>
        </div>
        <div className="cs-facility-grid">
          {features.map((f, i) => <div key={i} className="cs-facility-item"><Icons.check /><span>{f}</span></div>)}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    { q: "What are the clinic timings?", a: "Monday–Friday: 9 AM – 8 PM, Saturday: 9 AM – 6 PM. Sunday: Closed." },
    { q: "Do I need to book in advance?", a: "Walk-ins are welcome, but booking ensures minimal waiting time." },
    { q: "What payment methods are accepted?", a: "Cash, UPI, and all major debit/credit cards are accepted." },
    { q: "Is the clinic wheelchair accessible?", a: "Yes, our premises are fully wheelchair accessible." },
  ];
  return (
    <section className="cs-section cs-faq" id="faq" aria-label="FAQ">
      <div className="cs-container">
        <div className="cs-section-header">
          <span className="cs-section-tag">FAQ</span>
          <h2>Common Questions</h2>
        </div>
        <div className="cs-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className={`cs-faq-item ${openIndex === i ? "cs-open" : ""}`}>
              <button className="cs-faq-question" onClick={() => setOpenIndex(openIndex === i ? null : i)} aria-expanded={openIndex === i} aria-controls={`faq-ans-${i}`}>
                {faq.q}<span className="cs-faq-icon" aria-hidden="true">{openIndex === i ? "−" : "+"}</span>
              </button>
              <div id={`faq-ans-${i}`} className="cs-faq-answer" role="region" aria-hidden={openIndex !== i} style={{ display: openIndex === i ? "block" : "none" }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ clinic }) {
  const contacts = [
    ["Address", clinic.address || `${clinic.city}, Tamil Nadu`, <Icons.mapPin key="m" />],
    ["Phone", clinic.phone, <Icons.phone key="p" />],
    ["WhatsApp", clinic.whatsapp || clinic.phone, <Icons.whatsapp key="w" />],
    ["Email", clinic.email, <Icons.mail key="e" />],
  ].filter(([, v]) => v);
  const hours = [
    ["Monday – Friday", "9:00 AM – 8:00 PM", true],
    ["Saturday", "9:00 AM – 6:00 PM", true],
    ["Sunday", "Closed", false],
  ];
  return (
    <section className="cs-section cs-contact" id="contact" aria-label="Contact">
      <div className="cs-container">
        <div className="cs-contact-grid">
          <div>
            <span className="cs-section-tag">Find Us</span>
            <h2>Visit {clinic.name}</h2>
            <div className="cs-contact-list">
              {contacts.map(([label, value, icon], i) => (
                <div key={i} className="cs-contact-item"><span className="cs-contact-icon">{icon}</span><div><span className="cs-contact-label">{label}</span><span className="cs-contact-value">{value}</span></div></div>
              ))}
            </div>
          </div>
          <div className="cs-hours">
            <h3><Icons.clock /> Working Hours</h3>
            {hours.map(([day, time, open], i) => <div key={i} className={`cs-hour-row ${!open ? "cs-closed" : ""}`}><span>{day}</span><span>{time}</span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingModal({ clinic, activeServices, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", service: "", date: "", time: "" });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("appointments").insert([{
        clinic_id: clinic.id, patient_name: formData.name, phone: formData.phone,
        service: formData.service, appt_date: formData.date, appt_time: formData.time,
        status: "pending", created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) { alert("Booking failed: " + err.message); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="cs-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Book Appointment">
      <div className="cs-modal">
        <button className="cs-modal-close" onClick={onClose} aria-label="Close"><Icons.close /></button>
        {submitted ? (
          <div className="cs-modal-success">
            <h2>✅ Appointment Requested</h2>
            <p>We will confirm your appointment shortly via WhatsApp/SMS.</p>
            <button className="cs-btn cs-btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2>Book Appointment</h2><p>At {clinic.name}</p>
            <form onSubmit={handleSubmit} className="cs-booking-form">
              <label className="cs-field"><span>Full Name *</span><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></label>
              <label className="cs-field"><span>Phone *</span><input type="tel" required pattern="[0-9]{10,}" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></label>
              {activeServices.length > 0 && (
                <label className="cs-field">
                  <span>Service *</span>
                  <select required value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })}>
                    <option value="">Select service</option>
                    {activeServices.map((s) => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </label>
              )}
              <div className="cs-field-row">
                <label className="cs-field"><span>Preferred Date</span><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} min={new Date().toISOString().split("T")[0]} /></label>
                <label className="cs-field"><span>Preferred Time</span><input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></label>
              </div>
              <button type="submit" className="cs-btn cs-btn-primary cs-btn-full" disabled={submitting}>{submitting ? "Booking..." : "Confirm Booking"}</button>
            </form>
            <p className="cs-compliance-note"><Icons.shield /> Your data is protected under DPDP Act, 2023</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — FIXED: Accepts slug as PROP from Router.jsx
   ═══════════════════════════════════════════════════════════════ */

export default function ClinicSite({ slug }) {
  // Router.jsx passes slug as a PROP: <ClinicSite slug={route.slug} />
  // NOT from react-router useParams()

  const [clinic, setClinic] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Get slug from prop or fallback to URL path
        const clinicSlug = slug || window.location.pathname.replace(/^\//, "").split("/")[0] || "demo";
        console.log("[ClinicSite] Fetching clinic with slug:", clinicSlug);

        // FIX: Use .maybeSingle() instead of .single()
        const { data: clinicData, error: clinicErr } = await supabase
          .from("clinics")
          .select("*")
          .eq("slug", clinicSlug)
          .eq("is_published", true)
          .maybeSingle();

        if (clinicErr) {
          console.error("[ClinicSite] Clinic query error:", clinicErr);
          throw new Error("Database error: " + clinicErr.message);
        }

        if (!clinicData) {
          console.error("[ClinicSite] No clinic found for slug:", clinicSlug);
          throw new Error(`Clinic "${clinicSlug}" not found. It may not be published yet.`);
        }

        console.log("[ClinicSite] Found clinic:", clinicData.name, "theme:", clinicData.theme_id);
        setClinic(clinicData);

        // FIX: Use .maybeSingle() for doctor
        const { data: doctorData } = await supabase
          .from("doctors")
          .select("*")
          .eq("clinic_id", clinicData.id)
          .eq("is_active", true)
          .maybeSingle();
        setDoctor(doctorData || null);

        const { data: svcData } = await supabase
          .from("services")
          .select("*")
          .eq("clinic_id", clinicData.id)
          .eq("is_active", true);
        setServices(svcData || []);

      } catch (err) {
        console.error("[ClinicSite] Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [clinic]);

  if (loading) {
    return (
      <div className="cs-loading" role="status" aria-live="polite">
        <div className="cs-spinner" aria-hidden="true" />
        <p>Loading clinic information...</p>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="cs-error" role="alert">
        <h2>Clinic Not Found</h2>
        <p>{error || "The requested clinic could not be loaded."}</p>
        <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", marginTop: 12 }}>
          URL slug: <code>{slug || window.location.pathname}</code>
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: 8 }}>
          Check the browser console (F12 → Console) for detailed error logs.
        </p>
      </div>
    );
  }

  const activeServices = services;

  return (
    <>
      <ThemeProvider theme={clinic.theme_id || "default"} />
      <div className="cs-root">
        <header className="cs-topbar">
          <div className="cs-container cs-topbar-inner">
            <div className="cs-logo"><Icons.tooth /><span>{clinic.name}</span></div>
            <nav className="cs-nav" aria-label="Main navigation">
              <a href="#services">Services</a>
              <a href="#doctor">Doctor</a>
              <a href="#facility">Facility</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Contact</a>
            </nav>
            <div className="cs-topbar-actions">
              <NotificationBell clinicId={clinic.id} />
              <button className="cs-btn cs-btn-primary cs-btn-sm" onClick={() => setShowBookModal(true)}>Book Now</button>
            </div>
          </div>
        </header>

        <main>
          <HeroSection clinic={clinic} doctor={doctor} activeServices={activeServices} onBookClick={() => setShowBookModal(true)} />
          <ServicesSection services={activeServices} />
          <DoctorSection doctor={doctor} clinic={clinic} />
          <FacilitySection />
          <FAQSection />
          <ContactSection clinic={clinic} />
        </main>

        <ClinicFooter clinic={clinic} doctor={doctor} regNo={doctor?.reg_number} council={doctor?.council_name} />
        <DPDPConsentBlock clinicId={clinic.id} />

        <div className="cs-fab-group">
          {clinic.whatsapp && <a href={`https://wa.me/91${clinic.whatsapp.replace(/\D/g, "")}`} className="cs-fab cs-fab-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icons.whatsapp /></a>}
          {clinic.phone && <a href={`tel:${clinic.phone}`} className="cs-fab cs-fab-phone" aria-label="Call"><Icons.phone /></a>}
        </div>

        {showBookModal && <BookingModal clinic={clinic} activeServices={activeServices} onClose={() => setShowBookModal(false)} />}
      </div>
    </>
  );
}