// src/templates/SleekCybermed.jsx
// Archetype 2 — "The High-Tech Innovator"
// Deep obsidian canvas + electric cyan. For advanced surgery, laser eye,
// neurology, sports medicine — clinics that need to say "most advanced tech."
// Accepts: clinic, services, doctors, media, hours, branches, onBookClick

import { useState, useEffect, useRef } from "react";
import BookingEngine        from "../components/BookingEngine";
import ClinicFooter         from "../components/ClinicFooter";
import ClinicMediaSection   from "../components/ClinicMediaSection";
import { Section, SafeImage, SAFEGUARD_CSS } from "../lib/designSafeguards.jsx";

const ARCHETYPE = "cybermed";

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

export default function SleekCybermed({ clinic, services = [], doctors = [], media = [], hours = [], branches = [], onBookClick }) {
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
    bg: "#0B0F19",
    slate: "#1E293B",
    slateLight: "#243044",
    cyan: "#00E5FF",
    cyanDim: "rgba(0,229,255,0.15)",
    text: "#E6EEF5",
    muted: "#8A97AC",
    border: "rgba(0,229,255,0.18)",
    white: "#ffffff",
  };

  const journey = [
    { t: "Consult",   d: "Diagnostic review with your specialist" },
    { t: "Plan",      d: "Personalized treatment protocol built" },
    { t: "Procedure", d: "Performed with advanced clinical tech" },
    { t: "Recovery",  d: "Guided follow-up until you're fully well" },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{SAFEGUARD_CSS}</style>

      {showBook && (
        <div onClick={e => e.target === e.currentTarget && setShowBook(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(11,15,25,0.88)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 520 }}>
            <button onClick={() => setShowBook(false)} style={{ position: "absolute", top: -14, right: -14, zIndex: 10,
              width: 32, height: 32, borderRadius: "50%", background: C.white, border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
            <BookingEngine hours={hours} branches={branches} clinic={clinic} services={activeServices} doctors={doctors} />
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(11,15,25,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        transition: "all .3s", padding: "0 24px", height: 66,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {clinic.logo_url
              ? <SafeImage archetypeId={ARCHETYPE} src={clinic.logo_url} alt={clinic.name} />
              : <div style={{ width: 36, height: 36, borderRadius: 8,
                  background: `linear-gradient(135deg,${C.slate},${C.cyan})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.bg, fontSize: 15, fontWeight: 800 }}>
                  {(clinic.name || "C").charAt(0).toUpperCase()}
                </div>}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{clinic.name}</div>
            {clinic.specialty && <div style={{ fontSize: 10, color: C.cyan, letterSpacing: 1.5, textTransform: "uppercase" }}>{clinic.specialty}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[["Services", "#services"], ["Journey", "#journey"], ["Doctor", "#doctor"], ["Contact", "#contact"]].map(([l, h]) => (
            <a key={l} href={h} style={{ textDecoration: "none", color: C.muted, fontSize: 13, transition: "color .15s" }}
              onMouseEnter={e => e.target.style.color = C.cyan}
              onMouseLeave={e => e.target.style.color = C.muted}>{l}</a>
          ))}
          <button onClick={handleBook} style={{
            background: C.cyan, color: "#001014", border: "none", borderRadius: 8, padding: "9px 22px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: .3,
            boxShadow: `0 0 20px ${C.cyanDim}` }}>
            Book Now
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh", paddingTop: 66,
        background: `radial-gradient(ellipse 55% 60% at 82% 30%, rgba(0,229,255,0.10), transparent),
                     radial-gradient(ellipse 45% 55% at 15% 85%, rgba(0,229,255,0.05), transparent), ${C.bg}`,
        display: "flex", alignItems: "center", padding: "80px 24px",
      }}>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
              background: C.cyanDim, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: "5px 14px", fontSize: 11, color: C.cyan,
              fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, display: "inline-block", boxShadow: `0 0 8px ${C.cyan}` }} />
              {clinic.specialty} · {clinic.city}
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,4.5vw,58px)",
              fontWeight: 800, color: C.white, lineHeight: 1.08, marginBottom: 24 }}>
              {clinic.heroTagline || (<>Precision Care.<br /><span style={{ color: C.cyan, textShadow: `0 0 24px ${C.cyanDim}` }}>Advanced Technology.</span></>)}
            </h1>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              {clinic.tagline || `${clinic.name} combines specialist expertise with the latest clinical technology, in ${clinic.city}.`}
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={handleBook} style={{
                background: C.cyan, color: "#001014", border: "none", borderRadius: 10, padding: "14px 30px",
                fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 30px ${C.cyanDim}` }}>
                Book Consultation →
              </button>
              <a href="#journey" style={{ display: "flex", alignItems: "center", color: C.text, fontSize: 14, textDecoration: "none",
                border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 24px" }}>
                See the Process
              </a>
            </div>
          </div>
          <Reveal>
            <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: 20, background: C.slate,
              border: `1px solid ${C.border}`, overflow: "hidden", position: "relative" }}>
              {doctor?.photo_url
                ? <SafeImage archetypeId={ARCHETYPE} src={doctor.photo_url} alt={doctor.name} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90 }}>🩺</div>}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20,
                background: "linear-gradient(0deg, rgba(11,15,25,0.9), transparent)" }}>
                {doctor && <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{doctor.name}</div>}
                {doctor?.degree && <div style={{ color: C.cyan, fontSize: 11 }}>{doctor.degree}</div>}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services — glow-infused bento grid */}
      {activeServices.length > 0 && (
        <Section archetypeId={ARCHETYPE} id="services" background={C.bg}>
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: C.cyan, marginBottom: 10 }}>Services</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: C.white, marginBottom: 48 }}>Clinical Capabilities</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 18 }}>
            {activeServices.map((svc, i) => (
              <Reveal key={svc.id || i} delay={i * 0.05}>
                <div className="cybermed-bento" style={{ background: C.slate, borderRadius: 14, padding: "26px 22px",
                  border: `1px solid ${C.border}`, position: "relative", overflow: "hidden", transition: "all .25s" }}>
                  <div className="cybermed-glow" style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140,
                    borderRadius: "50%", background: C.cyan, filter: "blur(50px)", opacity: 0, transition: "opacity .3s" }} />
                  <div style={{ fontSize: 26, marginBottom: 14, position: "relative" }}>{svc.icon || "⚡"}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 6, position: "relative" }}>{svc.name}</div>
                  {svc.description && <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, position: "relative" }}>{svc.description}</div>}
                  {svc.price && !svc.hide_price && <div style={{ fontSize: 12, fontWeight: 700, color: C.cyan, marginTop: 12, position: "relative" }}>Fee: {svc.price}</div>}
                </div>
              </Reveal>
            ))}
          </div>
          <style>{`
            .cybermed-bento:hover { border-color: ${C.cyan}; transform: translateY(-4px); }
            .cybermed-bento:hover .cybermed-glow { opacity: .22; }
          `}</style>
        </Section>
      )}

      {/* Patient journey — monochromatic interactive timeline */}
      <Section archetypeId={ARCHETYPE} id="journey" background={C.slate}>
        <Reveal>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: C.cyan, marginBottom: 10 }}>The Process</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,3vw,36px)", fontWeight: 800, color: C.white, marginBottom: 56 }}>Your Patient Journey</h2>
        </Reveal>
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ position: "absolute", left: 11, top: 6, bottom: 6, width: 1, background: `linear-gradient(180deg, ${C.cyan}, transparent)` }} />
          {journey.map((step, i) => (
            <Reveal key={step.t} delay={i * 0.1}>
              <div style={{ display: "flex", gap: 24, marginBottom: 40, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.bg, border: `2px solid ${C.cyan}`,
                  flexShrink: 0, boxShadow: `0 0 14px ${C.cyanDim}`, marginTop: 2 }} />
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 4 }}>{step.t}</div>
                  <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{step.d}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Doctor */}
      {doctor && (
        <Section archetypeId={ARCHETYPE} id="doctor" background={C.bg}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 60, alignItems: "center" }}>
            <Reveal>
              <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: 16, background: C.slate,
                border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {doctor.photo_url
                  ? <SafeImage archetypeId={ARCHETYPE} src={doctor.photo_url} alt={doctor.name} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100 }}>👨‍⚕️</div>}
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: C.cyan, marginBottom: 10 }}>Your Specialist</div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: C.white, marginBottom: 6 }}>{doctor.name}</h2>
              <div style={{ color: C.cyan, fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{doctor.degree}</div>
              {doctor.reg_number && <div style={{ fontSize: 11, color: C.muted, marginBottom: 20, fontFamily: "monospace" }}>Reg No: {doctor.reg_number}{doctor.council_name ? ` — ${doctor.council_name}` : ""}</div>}
              {doctor.bio && <p style={{ color: C.muted, lineHeight: 1.8, fontSize: 15, marginBottom: 28 }}>{doctor.bio}</p>}
              <button onClick={handleBook} style={{
                background: C.cyan, color: "#001014", border: "none", borderRadius: 10, padding: "14px 28px",
                fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 24px ${C.cyanDim}` }}>
                Book a Consultation
              </button>
            </Reveal>
          </div>
        </Section>
      )}

      <ClinicMediaSection clinic={clinic} mediaItems={media} />

      {/* Contact */}
      <Section archetypeId={ARCHETYPE} id="contact" background={C.slate}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }}>
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: C.cyan, marginBottom: 10 }}>Find Us</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 34, fontWeight: 800, color: C.white, marginBottom: 32 }}>Visit {clinic.name}</h2>
            {[["📍", "Address", clinic.address || `${clinic.city}, Tamil Nadu`], ["📞", "Phone", clinic.phone], ["✉️", "Email", clinic.email]]
              .filter(([, , v]) => v).map(([icon, label, value]) => (
                <div key={label} style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 10, color: C.cyan, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, color: C.text }}>{value}</div>
                  </div>
                </div>
              ))}
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ background: C.bg, borderRadius: 14, padding: 28, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Clinic Hours</div>
              {[["Monday – Friday", "9:00 AM – 8:00 PM", true], ["Saturday", "9:00 AM – 6:00 PM", true], ["Sunday", "Closed", false]].map(([d, h, o]) => (
                <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{d}</span>
                  <span style={{ fontWeight: 700, color: o ? C.cyan : "#f87171" }}>{h}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <a href={`https://wa.me/${(clinic.whatsapp || clinic.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, background: "#25d366", color: "white", borderRadius: 8, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>💬 WhatsApp</a>
                <a href={`tel:${clinic.phone}`}
                  style={{ flex: 1, background: C.cyan, color: "#001014", borderRadius: 8, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>📞 Call Now</a>
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
          style={{ width: 50, height: 50, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.4)", transition: "transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>💬</a>
        <a href={`tel:${clinic.phone}`}
          style={{ width: 50, height: 50, borderRadius: "50%", background: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none", boxShadow: `0 4px 20px ${C.cyanDim}`, transition: "transform .2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>📞</a>
      </div>
    </div>
  );
}
