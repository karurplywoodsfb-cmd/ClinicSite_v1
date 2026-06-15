// src/components/admin/DomainManager.jsx
// Custom Domain tab in clinic admin panel
// Props: clinic (object with id, slug, custom_domain, domain_status etc.)

import { useState, useEffect } from "react";
import { addCustomDomain, removeCustomDomain, checkDomainStatus, getDomainInfo } from "../../lib/domainApi";

const STATUS_CONFIG = {
  not_configured: { color: "#94a3b8", bg: "#f1f5f9", icon: "○",  label: "Not configured"   },
  pending:        { color: "#d97706", bg: "#fef3c7", icon: "⏳", label: "Pending DNS setup" },
  verified:       { color: "#16a34a", bg: "#dcfce7", icon: "✓",  label: "Active & Live"     },
  error:          { color: "#dc2626", bg: "#fee2e2", icon: "✕",  label: "Error"             },
};

export default function DomainManager({ clinic }) {
  const [domainInfo,    setDomainInfo]    = useState(null);
  const [inputDomain,   setInputDomain]   = useState("");
  const [loading,       setLoading]       = useState(false);
  const [checking,      setChecking]      = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [dnsInstructions, setDnsInstructions] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => { loadDomainInfo(); }, [clinic.id]);

  const loadDomainInfo = async () => {
    try {
      const info = await getDomainInfo(clinic.id);
      setDomainInfo(info);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!inputDomain.trim()) return;
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const result = await addCustomDomain(clinic.id, inputDomain.trim());
      setDnsInstructions(result.dnsInstructions);
      setSuccess("Domain added! Configure your DNS records below, then click Verify.");
      await loadDomainInfo();
      setInputDomain("");
    } catch (e) {
      setError(e.message || "Failed to add domain.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!domainInfo?.custom_domain) return;
    setChecking(true); setError(""); setSuccess("");
    try {
      const result = await checkDomainStatus(clinic.id, domainInfo.custom_domain);
      if (result.verified) {
        setSuccess("🎉 Domain verified! Your clinic site is now live on your custom domain.");
      } else {
        setError("DNS not propagated yet. This can take up to 48 hours. Check your DNS records are correct and try again.");
      }
      await loadDomainInfo();
    } catch (e) {
      setError(e.message || "Verification check failed.");
    } finally {
      setChecking(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      await removeCustomDomain(clinic.id, domainInfo.custom_domain);
      setSuccess("Domain removed successfully.");
      setDnsInstructions(null);
      setShowRemoveConfirm(false);
      await loadDomainInfo();
    } catch (e) {
      setError(e.message || "Failed to remove domain.");
    } finally {
      setLoading(false);
    }
  };

  const status     = domainInfo?.domain_status || "not_configured";
  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.not_configured;
  const hasDomain  = !!domainInfo?.custom_domain;

  const S = {
    card:    { background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 28, marginBottom: 20 },
    label:   { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    input:   { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px",
               fontSize: 14, color: "#0f172a", fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
    btn:     { borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
               border: "none", fontFamily: "inherit" },
    btnPrimary: { background: "#1565c0", color: "white" },
    btnGhost:   { background: "#f1f5f9", color: "#475569" },
    btnDanger:  { background: "#fee2e2", color: "#dc2626" },
    row:     { display: "flex", gap: 10, alignItems: "center", marginTop: 12 },
    dnsRow:  { display: "grid", gridTemplateColumns: "80px 1fr 1fr 80px", gap: 10,
               padding: "10px 12px", fontSize: 12, alignItems: "center" },
    mono:    { fontFamily: "monospace", fontSize: 12, background: "#f8fafc",
               border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 6px", wordBreak: "break-all" },
  };

  return (
    <div style={{ maxWidth: 680, fontFamily: "'DM Sans', sans-serif" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Custom Domain</h2>
      <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
        Point your own domain (e.g. <strong>www.drsmithclinic.in</strong>) to your ClinicSite page.
      </p>

      {/* Current status */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={S.label}>Current Domain</div>
            {hasDomain
              ? <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{domainInfo.custom_domain}</div>
              : <div style={{ fontSize: 15, color: "#94a3b8", marginBottom: 6 }}>No custom domain configured</div>
            }
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Default URL:{" "}
              <a href={`https://kdcv101.vercel.app/${clinic.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ color: "#1565c0", textDecoration: "none" }}>
                kdcv101.vercel.app/{clinic.slug}
              </a>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
            borderRadius: 20, background: statusConf.bg, color: statusConf.color,
            fontSize: 12, fontWeight: 700,
          }}>
            <span>{statusConf.icon}</span>
            <span>{statusConf.label}</span>
          </div>
        </div>

        {domainInfo?.domain_error && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fee2e2",
            borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
            ⚠ {domainInfo.domain_error}
          </div>
        )}

        {/* Actions for existing domain */}
        {hasDomain && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {status !== "verified" && (
              <button onClick={handleCheck} disabled={checking}
                style={{ ...S.btn, ...S.btnPrimary, opacity: checking ? .6 : 1 }}>
                {checking ? "Checking…" : "🔍 Verify Domain"}
              </button>
            )}
            {status === "verified" && (
              <a href={`https://${domainInfo.custom_domain}`} target="_blank" rel="noopener noreferrer"
                style={{ ...S.btn, ...S.btnPrimary, textDecoration: "none" }}>
                🌐 Open Live Site
              </a>
            )}
            <button onClick={() => setShowRemoveConfirm(true)}
              style={{ ...S.btn, ...S.btnDanger }}>
              Remove Domain
            </button>
          </div>
        )}

        {/* Remove confirmation */}
        {showRemoveConfirm && (
          <div style={{ marginTop: 14, padding: "14px", background: "#fff7ed",
            borderRadius: 8, border: "1px solid #fed7aa" }}>
            <div style={{ fontSize: 14, color: "#92400e", marginBottom: 10 }}>
              ⚠ Remove <strong>{domainInfo?.custom_domain}</strong>? The clinic site will revert to the default URL.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleRemove} disabled={loading}
                style={{ ...S.btn, ...S.btnDanger }}>
                {loading ? "Removing…" : "Yes, Remove"}
              </button>
              <button onClick={() => setShowRemoveConfirm(false)} style={{ ...S.btn, ...S.btnGhost }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add new domain */}
      {!hasDomain && (
        <div style={S.card}>
          <div style={S.label}>Add Custom Domain</div>
          <input
            value={inputDomain}
            onChange={e => setInputDomain(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="www.drsmithclinic.in or drsmithclinic.in"
            style={S.input}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            Enter without https:// — both apex (drsmith.in) and subdomain (www.drsmith.in) are supported.
          </div>
          <div style={S.row}>
            <button onClick={handleAdd} disabled={loading || !inputDomain.trim()}
              style={{ ...S.btn, ...S.btnPrimary, opacity: loading || !inputDomain.trim() ? .6 : 1 }}>
              {loading ? "Adding…" : "Add Domain →"}
            </button>
          </div>
        </div>
      )}

      {/* DNS Instructions */}
      {(hasDomain && status !== "verified") && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            📋 DNS Configuration
          </div>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Add these records in your domain registrar's DNS settings (GoDaddy, Namecheap, BigRock, etc.).
            Changes can take 5 minutes to 48 hours to propagate.
          </p>

          <DnsInstructionsTable domain={domainInfo?.custom_domain} S={S}/>

          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0f7ff",
            borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e40af", marginBottom: 4 }}>
              📌 After adding DNS records:
            </div>
            <ol style={{ fontSize: 12, color: "#3b82f6", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
              <li>Wait at least 15–30 minutes for propagation</li>
              <li>Click <strong>"Verify Domain"</strong> above</li>
              <li>If it fails, wait a few more hours and try again</li>
              <li>Use <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" style={{ color: "#1565c0" }}>dnschecker.org</a> to check if DNS has propagated globally</li>
            </ol>
          </div>
        </div>
      )}

      {/* Verified — success state */}
      {status === "verified" && (
        <div style={{ ...S.card, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d", marginBottom: 8 }}>
            🎉 Domain is Live!
          </div>
          <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
            Your clinic site is now accessible at{" "}
            <a href={`https://${domainInfo.custom_domain}`} target="_blank" rel="noopener noreferrer"
              style={{ color: "#15803d", fontWeight: 600 }}>
              https://{domainInfo.custom_domain}
            </a>
            {domainInfo.domain_verified_at && (
              <span style={{ color: "#4ade80", marginLeft: 8, fontSize: 11 }}>
                (verified {new Date(domainInfo.domain_verified_at).toLocaleDateString("en-IN")})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Error / success banners */}
      {error && (
        <div style={{ padding: "12px 16px", background: "#fee2e2", borderRadius: 8,
          fontSize: 13, color: "#dc2626", marginTop: 8 }}>
          ⚠ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "12px 16px", background: "#dcfce7", borderRadius: 8,
          fontSize: 13, color: "#16a34a", marginTop: 8 }}>
          ✓ {success}
        </div>
      )}

      {/* Help */}
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 16, lineHeight: 1.7 }}>
        Need help? Common registrars: GoDaddy → DNS Management, Namecheap → Advanced DNS,
        BigRock → DNS Records, Google Domains → DNS. Look for "CNAME" or "A Record" settings.
      </div>
    </div>
  );
}

// ── DNS Instructions Table ─────────────────────────────────────
function DnsInstructionsTable({ domain, S }) {
  const isSubdomain = domain && domain.split(".").length > 2;
  const host        = isSubdomain ? domain.split(".")[0] : "@";

  const records = isSubdomain
    ? [{ type: "CNAME", host, value: "cname.vercel-dns.com", ttl: "3600 / Auto" }]
    : [{ type: "A",     host: "@", value: "76.76.21.21",       ttl: "3600 / Auto" }];

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ ...S.dnsRow, background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0", fontWeight: 700, color: "#475569", fontSize: 11 }}>
        <span>TYPE</span>
        <span>HOST / NAME</span>
        <span>VALUE / POINTS TO</span>
        <span>TTL</span>
      </div>
      {records.map((r, i) => (
        <div key={i} style={{ ...S.dnsRow, borderBottom: i < records.length - 1 ? "1px solid #f1f5f9" : "none",
          background: i % 2 === 0 ? "white" : "#fafafa" }}>
          <span style={{ ...S.mono, color: "#1565c0", fontWeight: 700 }}>{r.type}</span>
          <span style={S.mono}>{r.host}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={S.mono}>{r.value}</span>
            <button onClick={() => navigator.clipboard.writeText(r.value)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#94a3b8" }}
              title="Copy">📋</button>
          </div>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.ttl}</span>
        </div>
      ))}
    </div>
  );
}
