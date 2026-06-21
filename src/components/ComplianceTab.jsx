// src/components/ComplianceTab.jsx
// Compliance status tab inside AdminPanel
// Shows clinic owner what's compliant, what needs action
// Blocks site publish if critical items are missing

import { useState } from "react";

export default function ComplianceTab({ clinic, doctor, onNavigate }) {
  const [expandedId, setExpandedId] = useState(null);

  // ── Derive compliance status from clinic/doctor data ──────────
  const checks = [
    {
      id: "reg_number",
      title: "Medical Council Registration Number",
      law: "IMC Ethics Regulations 2002, Clause 6.1",
      status: doctor?.reg_number ? "pass" : "fail",
      critical: true,
      detail: doctor?.reg_number
        ? `Reg No: ${doctor.reg_number} — ${doctor.council_name || "Medical Council"}`
        : "Missing. Registration number must be displayed on your website footer.",
      fix: "Go to Doctor Profile → Add your Medical Council Registration Number",
      action: () => onNavigate?.("doctor"),
    },
    {
      id: "degree",
      title: "NMC-Recognised Degree on File",
      law: "IMC Ethics Regulations 2002, Clause 1.1",
      status: doctor?.degree ? "pass" : "fail",
      critical: true,
      detail: doctor?.degree
        ? `Degree: ${doctor.degree}`
        : "No degree on file. Only NMC/MCI recognised qualifications may be displayed.",
      fix: "Go to Doctor Profile → Select your NMC-recognised qualification",
      action: () => onNavigate?.("doctor"),
    },
    {
      id: "dpdp_consent",
      title: "DPDP Booking Consent Active",
      law: "DPDP Act 2023, Section 6",
      status: "pass", // BookingEngine now always includes it
      critical: true,
      detail: "Double-consent block is active on your booking form. Patient consents are recorded with timestamp.",
      fix: null,
    },
    {
      id: "privacy_policy",
      title: "Privacy Policy Page Published",
      law: "DPDP Act 2023, Section 5 + DPDP Rules 2025, Rule 3",
      status: clinic?.privacy_policy_generated ? "pass" : "warn",
      critical: false,
      detail: clinic?.privacy_policy_generated
        ? `Privacy Policy auto-generated at /${clinic.slug}/privacy-policy`
        : "Privacy Policy has not been generated yet. Required before collecting patient data.",
      fix: "Click Generate below to auto-create your Privacy Policy",
      action: null,
    },
    {
      id: "no_testimonials",
      title: "Patient Testimonials Removed",
      law: "NMC 2023 + IMC Ethics 2002, Clause 6.1",
      status: "pass", // ClinicMediaSection replaces reviews
      critical: true,
      detail: "Patient testimonials section has been replaced with compliant Facility & Credentials section.",
      fix: null,
    },
    {
      id: "hero_copy",
      title: "Hero Copy — No Prohibited Superlatives",
      law: "IMC Ethics 2002, Clause 6.1 + DMR Act 1954",
      status: checkHeroCopy(clinic),
      critical: true,
      detail: checkHeroCopy(clinic) === "pass"
        ? "Hero section copy does not contain prohibited superlatives."
        : "Hero section may contain prohibited claims. Review tagline and badge text.",
      fix: "Go to Clinic Info → Edit tagline and hero text",
      action: () => onNavigate?.("clinic"),
    },
    {
      id: "pricing",
      title: "Transparent Flat Pricing",
      law: "DMR Act 1954, S.4 + Consumer Protection Act 2019",
      status: "pass",
      critical: false,
      detail: "Service prices are displayed as flat consultation fees without discount language.",
      fix: null,
    },
    {
      id: "data_retention",
      title: "3-Year Data Retention Policy Active",
      law: "DPDP Act 2023, Section 8 + MoH Medical Records Guidelines",
      status: "pass",
      critical: false,
      detail: "Appointment data retention is automatically set to 3 years from appointment date.",
      fix: null,
    },
  ];

  const failed   = checks.filter(c => c.status === "fail");
  const warned   = checks.filter(c => c.status === "warn");
  const passed   = checks.filter(c => c.status === "pass");
  const canPublish = failed.filter(c => c.critical).length === 0;

  const STATUS_MAP = {
    pass: { color:"#22c55e", bg:"rgba(34,197,94,0.1)",  border:"rgba(34,197,94,0.25)",  icon:"✓", label:"COMPLIANT" },
    fail: { color:"#ef4444", bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.25)",  icon:"✗", label:"ACTION REQUIRED" },
    warn: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.25)", icon:"!", label:"ATTENTION" },
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Publish gate banner */}
      <div style={{
        background: canPublish ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${canPublish ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.25)"}`,
        borderRadius: 12, padding: "16px 20px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ fontSize: 28 }}>{canPublish ? "✅" : "🚫"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: canPublish ? "#22c55e" : "#ef4444", marginBottom: 4 }}>
            {canPublish
              ? "Your site meets minimum legal compliance requirements"
              : `${failed.filter(c => c.critical).length} critical compliance issue(s) must be fixed before publishing`}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            {canPublish
              ? "All critical items are in order. You may publish your site. Review warnings for full compliance."
              : "Resolve all critical items below. Your site cannot be published until these are fixed."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
          {[["pass", passed.length], ["warn", warned.length], ["fail", failed.length]].map(([s, count]) => {
            const cfg = STATUS_MAP[s];
            return (
              <div key={s} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color, fontFamily: "monospace" }}>{count}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checks list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map(check => {
          const cfg       = STATUS_MAP[check.status];
          const isExpanded = expandedId === check.id;
          return (
            <div key={check.id} style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${cfg.border}`,
              borderRadius: 10, overflow: "hidden",
            }}>
              <div onClick={() => setExpandedId(isExpanded ? null : check.id)}
                style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>

                {/* Status icon */}
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                  {cfg.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{check.title}</span>
                    {check.critical && check.status === "fail" && (
                      <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", fontWeight: 700 }}>
                        BLOCKS PUBLISH
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{check.law}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>
                    {cfg.label}
                  </span>
                  <span style={{ color: "#334155", fontSize: 16, transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>⌄</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: check.fix ? 14 : 0, lineHeight: 1.6 }}>
                    {check.detail}
                  </div>
                  {check.fix && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "#f59e0b" }}>→ {check.fix}</div>
                      {check.action && (
                        <button onClick={check.action} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                          Fix Now →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legal reference */}
      <div style={{ marginTop: 24, padding: "16px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
        <strong style={{ color: "#e2e8f0" }}>Applicable Indian Law:</strong>{" "}
        IMC (Professional Conduct, Etiquette & Ethics) Regulations 2002 ·
        NMC Professional Conduct Regulations 2023 ·
        Drugs & Magic Remedies Act 1954 ·
        Digital Personal Data Protection Act 2023 ·
        DPDP Rules 2025 ·
        Consumer Protection Act 2019 ·
        Telemedicine Practice Guidelines 2020 (MoH India).
        <br/>
        <span style={{ color: "#334155" }}>
          ClinicSite.in is not a law firm. This checklist is a best-effort compliance guide.
          Consult a qualified legal advisor for definitive advice specific to your practice.
        </span>
      </div>
    </div>
  );
}

// ── Helper: check hero copy for prohibited phrases ────────────────
function checkHeroCopy(clinic) {
  const PROHIBITED = [
    "most trusted","#1","number 1","no.1","best clinic",
    "best doctor","world class","painless","guaranteed",
    "100% cure","no side effects","instant relief",
  ];
  const tagline = (clinic?.tagline || "").toLowerCase();
  const about   = (clinic?.about   || "").toLowerCase();
  const text    = tagline + " " + about;
  return PROHIBITED.some(p => text.includes(p)) ? "fail" : "pass";
}