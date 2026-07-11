// src/components/admin/SeoPage.jsx
// AdminPanel "SEO" tab — health checks + auto-generated meta tag preview.
// Purely presentational (reads clinic + hasRegNo, no writes) so this is a
// clean, low-risk extraction from AdminPanel.jsx.

const CHECKS_STATIC = [
  ["MedicalClinic Schema",    true],
  ["LocalBusiness Schema",    true],
  ["FAQPage Schema",          true],
  ["Meta Title (auto)",       true],
  ["Meta Description (auto)",true],
  ["Sitemap ready",           true],
  ["Mobile optimized",        true],
  ["HTTPS active",            true],
  ["Reviews removed ✓",       true],
];

const BOOST_TIPS = [
  "Add Reg No to enable 'Verified Doctor' schema",
  "Publish 2 blog articles to reach SEO score 98+",
  "Add Google Business Profile listing for map pack",
  "Upload clinic facility photos for rich snippets",
];

export default function SeoPage({ clinic, hasRegNo }) {
  const checks = [
    ...CHECKS_STATIC,
    ["Reg No. in footer",   hasRegNo],
    ["Privacy Policy page", !!clinic?.privacy_policy_generated],
  ];

  const metaTags = [
    ["TITLE", `${clinic?.name} | ${clinic?.specialty} in ${clinic?.city} | Book Appointment`],
    ["DESCRIPTION", `Expert ${(clinic?.specialty||"").toLowerCase()} care in ${clinic?.city}. Book appointment online.`],
    ["CANONICAL", `https://${clinic?.slug}.clinicsite.in`],
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      <div style={{ background:"rgba(255,255,255,0.02)",
        border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 }}>
        <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:16 }}>
          SEO HEALTH CHECKS
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20,
          padding:14, background:"rgba(34,197,94,0.06)",
          border:"1px solid rgba(34,197,94,0.2)", borderRadius:10 }}>
          <div style={{ fontSize:36, fontWeight:700, color:"#22c55e", fontFamily:"monospace" }}>91</div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>Great SEO Score</div>
            <div style={{ fontSize:12, color:"#64748b" }}>
              Auto-configured for {clinic?.city}
            </div>
          </div>
        </div>
        {checks.map(([label, status], i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
            padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)",
            fontSize:12 }}>
            <span style={{ color: status ? "#22c55e" : "#ef4444" }}>
              {status ? "✓" : "✗"}
            </span>
            <span style={{ color: status ? "#94a3b8" : "#64748b", flex:1 }}>{label}</span>
            <span style={{ fontSize:10, fontFamily:"monospace",
              color: status ? "#22c55e" : "#ef4444" }}>
              {status ? "Active" : "Missing"}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ background:"rgba(255,255,255,0.02)",
          border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
          <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:12 }}>
            AUTO-GENERATED META TAGS
          </div>
          {metaTags.map(([k, v]) => (
            <div key={k} style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#475569", marginBottom:4 }}>{k}</div>
              <div style={{ background:"#0a0d14", borderRadius:6, padding:"8px 10px",
                fontSize:11, color:"#93c5fd", fontFamily:"monospace",
                wordBreak:"break-all" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(245,158,11,0.05)",
          border:"1px solid rgba(245,158,11,0.2)", borderRadius:12, padding:18 }}>
          <div style={{ fontFamily:"monospace", fontSize:12, color:"#f59e0b", marginBottom:10 }}>
            💡 BOOST TIPS
          </div>
          {BOOST_TIPS.map((tip, i) => (
            <div key={i} style={{ display:"flex", gap:8, fontSize:12,
              color:"#94a3b8", padding:"4px 0" }}>
              <span style={{ color:"#f59e0b" }}>→</span>{tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
