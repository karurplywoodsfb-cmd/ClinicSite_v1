// src/pages/LandingPage.jsx
// Public marketing landing page — shown at waspace.in/
// Brand: WaSpace — layout follows the approved marketing mockup.

// ── Brand tokens ─────────────────────────────────────────────────
const BRAND = {
  primary:   "#5B5CEB",
  primaryD:  "#4645C7",
  navy:      "#1E2A44",
  green:     "#22C55E",
  gold:      "#D4AF37",
  bgTint:    "#F6F8FC",
  border:    "#E7E9F3",
};

// ── Real product data (kept in sync with src/config/planConfig.ts) ─
const PLANS = [
  {
    id: "free", name: "Starter", price: "₹0", period: "/month",
    desc: "Perfect for getting started",
    features: ["1 website", "WaSpace branding", "50 appointments / mo", "3 services listed", "Basic templates"],
    cta: "Start Free", highlight: false,
  },
  {
    id: "premium", name: "Premium", price: "₹499", period: "/month",
    desc: "Everything you need to grow",
    features: ["1 website", "Custom domain", "500 appointments / mo", "20 services listed", "Priority support", "Advanced analytics"],
    cta: "Start 7-Day Free Trial", highlight: true, badge: "Most Popular",
  },
  {
    id: "enterprise", name: "Enterprise", price: "₹1,999", period: "/month",
    desc: "For multi-location clinics",
    features: ["Unlimited appointments", "White-label (remove branding)", "API access", "Team management", "Bulk operations"],
    cta: "Talk to Us", highlight: false,
  },
];

const FEATURES = [
  { icon: "🧩", title: "Guided Setup Wizard", desc: "Answer a few questions about your clinic and get a live website in minutes — no coding." },
  { icon: "🩺", title: "Specialty Templates", desc: "13 templates purpose-built for dental, dermatology, ortho, physiotherapy and more." },
  { icon: "📅", title: "Online Appointments", desc: "Patients book straight from your site. DPDP Act 2023 compliant by default." },
  { icon: "💬", title: "WhatsApp Notifications", desc: "Automatic booking confirmations and reminders sent over WhatsApp & SMS." },
  { icon: "🔍", title: "Built-in SEO", desc: "Auto-generated meta tags, schema markup and keywords so clinics rank on Google." },
  { icon: "🌐", title: "Custom Domain", desc: "Point your own domain, like www.yourclinic.in, straight to your WaSpace site." },
];

const TEMPLATES = [
  { name: "Corporate Giant", desc: "Multi-Specialty Hospital", icon: "🏥" },
  { name: "Elite Aesthetics", desc: "Dermatology & Cosmetic", icon: "✨" },
  { name: "Nordic Sanctuary", desc: "Physiotherapy & Wellness", icon: "🌿" },
  { name: "Surgical Hub", desc: "Orthopedics & Cardiology", icon: "⚕️" },
];

const TESTIMONIALS = [
  { quote: "WaSpace made it incredibly easy to build our clinic website. We started getting appointment requests within the first week!", name: "Dr. Priya Sharma", role: "Dental Clinic, Chennai" },
  { quote: "The templates are beautiful and professional. My website looks amazing on mobile, and setup took less than an hour.", name: "Dr. Arvind Kumar", role: "Multispecialty Clinic, Coimbatore" },
  { quote: "Best platform for clinics. Simple, fast, and patient friendly. The WhatsApp reminders alone cut our no-shows in half.", name: "Dr. Neha Patel", role: "Family Clinic, Karur" },
];

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryD})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Pacifico','Segoe Script',cursive", fontSize: 17, color: "white",
        flexShrink: 0,
      }}>Wa</div>
      <span style={{ fontSize: 19, fontWeight: 800, color: BRAND.navy, letterSpacing: -0.3 }}>WaSpace</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: BRAND.navy, background: "white" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        .wa-container{max-width:1160px;margin:0 auto;padding:0 24px;}
        .wa-nav-links{display:flex;gap:32px;align-items:center;}
        .wa-nav-links a{color:#475569;text-decoration:none;font-size:14.5px;font-weight:500;}
        .wa-nav-links a:hover{color:${BRAND.primary};}
        .wa-btn{display:inline-flex;align-items:center;gap:6px;padding:11px 22px;border-radius:9px;font-size:14.5px;font-weight:700;cursor:pointer;text-decoration:none;border:none;font-family:inherit;transition:all .15s;}
        .wa-btn-primary{background:${BRAND.primary};color:white;box-shadow:0 6px 18px rgba(91,92,235,.28);}
        .wa-btn-primary:hover{background:${BRAND.primaryD};}
        .wa-btn-outline{background:white;color:${BRAND.navy};border:1.5px solid ${BRAND.border};}
        .wa-btn-outline:hover{border-color:${BRAND.primary};color:${BRAND.primary};}
        .wa-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
        .wa-hero-badge{display:block;}
        .wa-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .wa-template-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
        .wa-testimonial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .wa-pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .wa-footer-grid{display:grid;grid-template-columns:1.4fr repeat(4,1fr);gap:32px;}
        @media (max-width:900px){
          .wa-nav-links{display:none;}
          .wa-hero-badge{display:none;}
          .wa-hero-grid{grid-template-columns:1fr;}
          .wa-feature-grid{grid-template-columns:repeat(2,1fr);}
          .wa-template-grid{grid-template-columns:repeat(2,1fr);}
          .wa-testimonial-grid{grid-template-columns:1fr;}
          .wa-pricing-grid{grid-template-columns:1fr;}
          .wa-footer-grid{grid-template-columns:repeat(2,1fr);}
        }
      `}</style>

      {/* ── Nav ── */}
      <header style={{ borderBottom: `1px solid ${BRAND.border}`, position: "sticky", top: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", zIndex: 50 }}>
        <div className="wa-container" style={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <nav className="wa-nav-links">
            <a href="#features">Features</a>
            <a href="#templates">Templates</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">Resources</a>
          </nav>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href="/login" className="wa-btn wa-btn-outline" style={{ padding: "9px 18px" }}>Login</a>
            <a href="/login" className="wa-btn wa-btn-primary">Get Started Free</a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: "80px 0 64px" }}>
        <div className="wa-container wa-hero-grid">
          <div>
            <h1 style={{ fontSize: "clamp(34px,4.2vw,48px)", lineHeight: 1.12, fontWeight: 800, letterSpacing: -1, marginBottom: 18 }}>
              Beautiful Websites for <span style={{ color: BRAND.primary }}>Modern Clinics</span>
            </h1>
            <p style={{ fontSize: 17, color: "#5B6472", lineHeight: 1.7, marginBottom: 28, maxWidth: 460 }}>
              Create, customize, and launch your clinic website in minutes. No coding. No hassle.
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <a href="/login" className="wa-btn wa-btn-primary" style={{ padding: "14px 26px", fontSize: 15.5 }}>Start Building for Free →</a>
              <a href="#templates" className="wa-btn wa-btn-outline" style={{ padding: "14px 26px", fontSize: 15.5 }}>View Templates</a>
            </div>
            <div style={{ fontSize: 13, color: "#94A3B8" }}>✓ No credit card required</div>
          </div>

          {/* Mock browser preview of a generated clinic site */}
          <div style={{ position: "relative" }}>
            <div style={{ background: "white", borderRadius: 16, border: `1px solid ${BRAND.border}`, boxShadow: "0 24px 60px rgba(30,42,68,0.12)", overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 6, padding: "12px 14px", borderBottom: `1px solid ${BRAND.border}` }}>
                <div style={{ width: 9, height: 9, borderRadius: 99, background: "#F87171" }} />
                <div style={{ width: 9, height: 9, borderRadius: 99, background: "#FBBF24" }} />
                <div style={{ width: 9, height: 9, borderRadius: 99, background: BRAND.green }} />
              </div>
              <div style={{ padding: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.primary, marginBottom: 14 }}>♥ SmileCare Dental</div>
                <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.25, marginBottom: 8 }}>
                  Compassionate Care for a <span style={{ color: BRAND.primary }}>Healthier</span> Everyday
                </div>
                <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 16, lineHeight: 1.6 }}>
                  Gentle, advanced dental care for a healthier, happier you.
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                  <div style={{ background: BRAND.primary, color: "white", fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 8 }}>Book Appointment</div>
                  <div style={{ border: `1px solid ${BRAND.border}`, fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 8 }}>Our Services</div>
                </div>
                <div style={{ display: "flex", gap: 18, borderTop: `1px solid ${BRAND.border}`, paddingTop: 14 }}>
                  {[["10+", "Years Experience"], ["2.5K+", "Happy Patients"], ["4.9★", "Google Rating"]].map(([n, l]) => (
                    <div key={l}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: BRAND.navy }}>{n}</div>
                      <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="wa-hero-badge" style={{ position: "absolute", bottom: -22, right: -18, width: 120, background: "white", borderRadius: 14, border: `1px solid ${BRAND.border}`, boxShadow: "0 20px 40px rgba(30,42,68,0.14)", padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.primary, marginBottom: 4 }}>SmileCare</div>
              <div style={{ fontSize: 9, color: "#94A3B8" }}>Compassionate care, every day.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Built for every specialty (real template categories) ── */}
      <section style={{ padding: "28px 0 56px", borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.bgTint }}>
        <div className="wa-container">
          <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#94A3B8", marginBottom: 18 }}>BUILT FOR EVERY CLINIC SPECIALTY</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
            {["🦷 Dental", "🩹 Physiotherapy", "✨ Dermatology", "👁️ Eye Care", "🦴 Orthopedics", "🌿 Ayurveda"].map(t => (
              <div key={t} style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "72px 0" }}>
        <div className="wa-container">
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 44px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: BRAND.primary, marginBottom: 10 }}>EVERYTHING YOU NEED</div>
            <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>All the Tools to Grow Your Clinic Online</h2>
          </div>
          <div className="wa-feature-grid">
            {FEATURES.map(f => (
              <div key={f.title} style={{ border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: 24, background: "white" }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: BRAND.bgTint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ── */}
      <section id="templates" style={{ padding: "72px 0", background: BRAND.bgTint }}>
        <div className="wa-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: BRAND.primary, marginBottom: 10 }}>BEAUTIFULLY DESIGNED TEMPLATES</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Stunning Templates for Every Specialty</h2>
              <p style={{ fontSize: 14, color: "#64748B" }}>13 templates to choose from. Customize your way, and go live in minutes.</p>
            </div>
            <a href="/login" style={{ color: BRAND.primary, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>View All Templates →</a>
          </div>
          <div className="wa-template-grid">
            {TEMPLATES.map(t => (
              <div key={t.name} style={{ background: "white", border: `1px solid ${BRAND.border}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ height: 100, background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>{t.icon}</div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "72px 0" }}>
        <div className="wa-container" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: BRAND.primary, marginBottom: 10 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, marginBottom: 44 }}>Launch Your Website in 3 Simple Steps</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
            {[
              ["🧭", "Choose a Template", "Pick a template that fits your clinic's specialty."],
              ["✏️", "Customize Easily", "Answer a few questions in our setup wizard to match your brand."],
              ["🚀", "Publish & Go Live", "Your website is ready. Share it with the world."],
            ].map(([icon, title, sub], i) => (
              <div key={title} style={{ maxWidth: 220 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: i === 2 ? BRAND.green : BRAND.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 16px" }}>{icon}</div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.6 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "72px 0", background: BRAND.bgTint }}>
        <div className="wa-container">
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, textAlign: "center", marginBottom: 40 }}>Loved by Doctors &amp; Clinic Owners</h2>
          <div className="wa-testimonial-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: "white", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: 22 }}>
                <div style={{ color: BRAND.gold, fontSize: 14, marginBottom: 12 }}>★★★★★</div>
                <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, marginBottom: 18 }}>{t.quote}</p>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "72px 0" }}>
        <div className="wa-container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: BRAND.primary, marginBottom: 10 }}>SIMPLE PRICING</div>
            <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>Start Free. Upgrade Anytime.</h2>
            <p style={{ fontSize: 14, color: "#64748B" }}>Choose the plan that's right for your clinic.</p>
          </div>
          <div className="wa-pricing-grid">
            {PLANS.map(p => (
              <div key={p.id} style={{
                position: "relative", background: p.highlight ? BRAND.navy : "white",
                border: p.highlight ? "none" : `1px solid ${BRAND.border}`,
                borderRadius: 16, padding: 28,
                boxShadow: p.highlight ? "0 20px 48px rgba(30,42,68,0.25)" : "none",
                transform: p.highlight ? "translateY(-8px)" : "none",
              }}>
                {p.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: BRAND.gold, color: BRAND.navy, fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 99 }}>{p.badge}</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: p.highlight ? "white" : BRAND.navy, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: p.highlight ? "rgba(255,255,255,0.6)" : "#94A3B8", marginBottom: 18 }}>{p.desc}</div>
                <div style={{ marginBottom: 22 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, color: p.highlight ? "white" : BRAND.navy }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.6)" : "#94A3B8" }}>{p.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.85)" : "#475569" }}>
                      <span style={{ color: BRAND.green }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <a href="/login" className="wa-btn" style={{
                  width: "100%", justifyContent: "center", padding: "12px",
                  background: p.highlight ? "white" : BRAND.bgTint,
                  color: BRAND.navy,
                }}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{ padding: "56px 0" }}>
        <div className="wa-container">
          <div style={{
            background: `linear-gradient(120deg, ${BRAND.primary}, ${BRAND.primaryD})`,
            borderRadius: 20, padding: "44px 40px", display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 20, color: "white",
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Ready to Grow Your Clinic Online?</div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>Join clinics across India building their online presence with WaSpace.</div>
            </div>
            <a href="/login" className="wa-btn" style={{ background: "white", color: BRAND.primary, padding: "14px 28px", fontSize: 15 }}>Start Building for Free →</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${BRAND.border}`, background: BRAND.bgTint, padding: "48px 0 28px" }}>
        <div className="wa-container">
          <div className="wa-footer-grid" style={{ marginBottom: 36 }}>
            <div>
              <Logo />
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 14, lineHeight: 1.7, maxWidth: 240 }}>
                The simplest way for clinics to create a stunning website that patients love.
              </p>
            </div>
            {[
              ["Product", ["Features", "Templates", "Pricing", "Changelog"]],
              ["Resources", ["Help Center", "Blog", "Guides", "Webinars"]],
              ["Company", ["About Us", "Contact Us", "Careers", "Affiliate Program"]],
            ].map(([title, links]) => (
              <div key={title}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{title}</div>
                {links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: "#64748B", marginBottom: 10 }}>{l}</div>
                ))}
              </div>
            ))}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Stay Updated</div>
              <p style={{ fontSize: 12.5, color: "#64748B", marginBottom: 12 }}>Get tips on growing your clinic online.</p>
              <div style={{ display: "flex", border: `1px solid ${BRAND.border}`, borderRadius: 9, overflow: "hidden", background: "white" }}>
                <input placeholder="Enter your email" style={{ flex: 1, border: "none", outline: "none", padding: "10px 12px", fontSize: 12.5, fontFamily: "inherit" }} />
                <button className="wa-btn wa-btn-primary" style={{ borderRadius: 0, padding: "10px 14px" }}>→</button>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 12.5, color: "#94A3B8" }}>
            <div>© {new Date().getFullYear()} WaSpace. All rights reserved.</div>
            <a href="/privacy" style={{ color: "#94A3B8", textDecoration: "none" }}>Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
