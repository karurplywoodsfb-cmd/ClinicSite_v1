// src/templates/PlayfulEditorial.jsx
// Archetype 5 — "The Joyful Comfort"
// Cream canvas + terracotta coral + Baltic blue, rounded Fredoka display type.
// For boutique pediatrics, premium maternity, child therapy — removes the
// "scary doctor's office" feeling without losing professionalism.
// Accepts: clinic, services, doctors, media, hours, branches, onBookClick

import { useState, useEffect, useRef } from "react";
import BookingEngine        from "../components/BookingEngine";
import ClinicFooter         from "../components/ClinicFooter";
import ClinicMediaSection   from "../components/ClinicMediaSection";
import { Section, SafeImage, SAFEGUARD_CSS } from "../lib/designSafeguards.jsx";

const ARCHETYPE = "playful";

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis?1:0, transform: vis?"none":"translateY(18px)", transition:`opacity .5s ${delay}s ease, transform .5s ${delay}s ease` }}>
      {children}
    </div>
  );
}

export default function PlayfulEditorial({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
  const [showBook, setShowBook] = useState(false);
  const [firstVisit, setFirstVisit] = useState(null); // gentle onboarding wizard state
  const [scrolled, setScrolled] = useState(false);
  const doctor = doctors[0];
  const activeServices = services.filter(s => s.is_active !== false);

  const handleBook = () => { if (onBookClick) onBookClick(); else setShowBook(true); };
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);

  const C = {
    bg: "#F9F6F0",
    surface: "#ffffff",
    coral: "#E76F51",
    coralLight: "#F2A38A",
    blue: "#457B9D",
    blueLight: "#7BA7C2",
    text: "#3A2E28",
    muted: "#8A7E74",
    border: "#EFE4D8",
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{SAFEGUARD_CSS}</style>

      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(58,46,40,0.55)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 520 }}>
            <button onClick={() => setShowBook(false)} style={{ position: "absolute", top: -14, right: -14, zIndex: 10,
              width: 32, height: 32, borderRadius: "50%", background: C.surface, border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
            <BookingEngine hours={hours} branches={branches} clinic={clinic} services={activeServices} doctors={doctors} />
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(249,246,240,0.95)" : "rgba(249,246,240,0.7)",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        transition: "all .3s", padding: "0 24px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 14, overflow: "hidden", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {clinic.logo_url
              ? <SafeImage archetypeId={ARCHETYPE} src={clinic.logo_url} alt={clinic.name} style={{ borderRadius: 14 }} />
              : <div style={{ width: 38, height: 38, borderRadius: 14,
                  background: `linear-gradient(135deg,${C.coral},${C.coralLight})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 16, fontWeight: 700 }}>
                  {(clinic.name || "C").charAt(0).toUpperCase()}
                </div>}
          </div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 17, fontWeight: 600, color: C.text }}>{clinic.name}</div>
        </div>
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {[["Services", "#services"], ["Doctor", "#doctor"], ["Contact", "#contact"]].map(([l, h]) => (
            <a key={l} href={h} style={{ textDecoration: "none", color: C.muted, fontSize: 13.5, fontWeight: 500 }}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background: C.coral, color: "white", border: "none", borderRadius: 24, padding: "10px 24px",
            fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(231,111,81,0.3)" }}>
            Book a Visit
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "88vh", display: "flex", alignItems: "center", padding: "80px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 340, height: 340, borderRadius: "50%", background: C.coralLight, opacity: .25 }} />
        <div style={{ position: "absolute", bottom: -100, left: -60, width: 260, height: 260, borderRadius: "50%", background: C.blueLight, opacity: .18 }} />
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 70, alignItems: "center", position: "relative" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(231,111,81,0.12)", borderRadius: 24, padding: "6px 16px", fontSize: 12, color: C.coral,
              fontWeight: 700, marginBottom: 26 }}>
              👶 {clinic.specialty || "Pediatric Care"} · {clinic.city}
            </div>
            <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "clamp(34px,4.2vw,54px)",
              fontWeight: 600, color: C.text, lineHeight: 1.15, marginBottom: 22 }}>
              {clinic.heroTagline || (<>Where kids feel<br /><span style={{ color: C.coral }}>safe & happy</span> at the doctor</>)}
            </h1>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 34, maxWidth: 440 }}>
              {clinic.tagline || `Warm, gentle, expert care for your little ones in ${clinic.city}.`}
            </p>
            <button onClick={handleBook} style={{
              background: C.coral, color: "white", border: "none", borderRadius: 26, padding: "15px 32px",
              fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 22px rgba(231,111,81,0.32)" }}>
              Book a Visit →
            </button>
          </div>
          <Reveal>
            <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: 32, background: C.surface,
              border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 20px 50px rgba(58,46,40,0.08)" }}>
              {doctor?.photo_url
                ? <SafeImage archetypeId={ARCHETYPE} src={doctor.photo_url} alt={doctor.name} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90 }}>🧸</div>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gentle onboarding wizard — replaces a scary intake form with a friendly choice */}
      <Section archetypeId={ARCHETYPE} background={C.surface}>
        <Reveal>
          <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 600, color: C.text, marginBottom: 10 }}>
              Let's make this easy 🌈
            </h2>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>Is this your child's first visit with us?</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {[["Yes, first visit! 🎈", true], ["No, we've been before 💙", false]].map(([label, val]) => (
                <button key={label} onClick={() => { setFirstVisit(val); handleBook(); }}
                  style={{
                    background: firstVisit === val ? C.coral : C.bg,
                    color: firstVisit === val ? "white" : C.text,
                    border: `2px solid ${firstVisit === val ? C.coral : C.border}`,
                    borderRadius: 20, padding: "20px 28px", fontSize: 14.5, fontWeight: 600,
                    cursor: "pointer", minWidth: 220, transition: "all .2s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Services — interactive character bento boxes */}
      {activeServices.length > 0 && (
        <Section archetypeId={ARCHETYPE} id="services" background={C.bg}>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue, marginBottom: 8 }}>Services</div>
            <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "clamp(24px,3vw,34px)", fontWeight: 600, color: C.text, marginBottom: 44 }}>How We Help</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 18 }}>
            {activeServices.map((svc, i) => (
              <Reveal key={svc.id || i} delay={i * 0.05}>
                <div className="playful-bento" style={{ background: C.surface, borderRadius: 22, padding: "26px 22px",
                  border: `1px solid ${C.border}`, transition: "all .25s" }}>
                  <div className="playful-icon" style={{ fontSize: 30, marginBottom: 12, display: "inline-block", transition: "transform .3s" }}>{svc.icon || "🩹"}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{svc.name}</div>
                  {svc.description && <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55 }}>{svc.description}</div>}
                  {svc.price && !svc.hide_price && <div style={{ fontSize: 12, fontWeight: 700, color: C.coral, marginTop: 12 }}>Fee: {svc.price}</div>}
                </div>
              </Reveal>
            ))}
          </div>
          <style>{`
            .playful-bento:hover { border-color: ${C.blueLight}; transform: translateY(-5px); box-shadow: 0 14px 30px rgba(69,123,157,0.14); }
            .playful-bento:hover .playful-icon { transform: rotate(-8deg) scale(1.15); }
          `}</style>
        </Section>
      )}

      {/* Doctor */}
      {doctor && (
        <Section archetypeId={ARCHETYPE} id="doctor" background={C.surface}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 56, alignItems: "center" }}>
            <Reveal>
              <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: 28, background: C.bg,
                border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {doctor.photo_url
                  ? <SafeImage archetypeId={ARCHETYPE} src={doctor.photo_url} alt={doctor.name} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100 }}>👩‍⚕️</div>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue, marginBottom: 8 }}>Meet Your Doctor</div>
              <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 32, fontWeight: 600, color: C.text, marginBottom: 6 }}>{doctor.name}</h2>
              <div style={{ color: C.coral, fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{doctor.degree}</div>
              {doctor.reg_number && <div style={{ fontSize: 11, color: C.muted, marginBottom: 18, fontFamily: "monospace" }}>Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}</div>}
              {doctor.bio && <p style={{ color: C.muted, lineHeight: 1.8, fontSize: 15, marginBottom: 26 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background: C.coral, color: "white", border: "none", borderRadius: 24, padding: "14px 28px",
                fontSize: 14.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 20px rgba(231,111,81,0.3)" }}>
                Book a Visit
              </button>
            </Reveal>
          </div>
        </Section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media} />

      {/* Contact */}
      <Section archetypeId={ARCHETYPE} id="contact" background={C.bg}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56 }}>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue, marginBottom: 8 }}>Find Us</div>
            <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 30, fontWeight: 600, color: C.text, marginBottom: 28 }}>Visit {clinic.name}</h2>
            {[["📍", "Address", clinic.address || `${clinic.city}, Tamil Nadu`], ["📞", "Phone", clinic.phone], ["✉️", "Email", clinic.email]]
              .filter(([, , v]) => v).map(([icon, label, value]) => (
                <div key={label} style={{ display: "flex", gap: 16, marginBottom: 18, alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 10.5, color: C.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, color: C.text }}>{value}</div>
                  </div>
                </div>
              ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background: C.surface, borderRadius: 22, padding: 28, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 16 }}>Clinic Hours</div>
              {[["Monday – Friday", "9:00 AM – 8:00 PM", true], ["Saturday", "9:00 AM – 6:00 PM", true], ["Sunday", "Closed", false]].map(([d, h, o]) => (
                <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{d}</span>
                  <span style={{ fontWeight: 700, color: o ? C.blue : "#e07a5f" }}>{h}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <a href={`https://wa.me/${(clinic.whatsapp || clinic.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, background: "#25d366", color: "white", borderRadius: 20, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>💬 WhatsApp</a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex: 1, background: C.coral, color: "white", borderRadius: 20, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>📞 Call Now</a>
              </div>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <a href={`/${clinic.slug}/privacy-policy`} style={{ fontSize: 11, color: C.muted, textDecoration: "none" }}>Privacy Policy (DPDP Act, 2023)</a>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <ClinicFooter clinic={clinic} doctor={doctor} hours={hours} />

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, display: "flex", flexDirection: "column", gap: 10 }}>
        <a href={`https://wa.me/${(clinic.whatsapp || clinic.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
          style={{ width: 52, height: 52, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.4)", transition: "transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width: 52, height: 52, borderRadius: "50%", background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none", boxShadow: "0 4px 16px rgba(231,111,81,0.4)", transition: "transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>📞</a>
      </div>
    </div>
  );
}
