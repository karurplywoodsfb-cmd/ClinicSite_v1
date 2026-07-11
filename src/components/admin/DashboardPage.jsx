// src/components/admin/DashboardPage.jsx
// AdminPanel "Dashboard" tab — greeting, compliance alert, stat cards,
// plan usage bars, today's appointments summary. Extracted from
// AdminPanel.jsx.

import { Badge } from "./ui";
import { UsageBar } from "../UsageBar";

export default function DashboardPage({ clinic, complianceAlert, onGoToDoctorTab, appts, branches }) {
  const stats = [
    { label:"Appointments",  value:appts.length,
      icon:"📅", color:"#3b82f6" },
    { label:"Pending",
      value:appts.filter(a => a.status === "pending").length,
      icon:"⏳", color:"#f59e0b" },
    { label:"SEO Score",     value:"91/100",
      icon:"🔍", color:"#22c55e" },
    { label:"Plan",
      value:(clinic?.plan || "Free").toUpperCase(),
      icon:"⭐", color:"#a855f7" },
  ];

  return (
    <div>
      <div style={{ marginBottom:20, fontSize:13, color:"#64748b" }}>
        Good morning 👋 — {clinic?.name}
      </div>

      {complianceAlert && (
        <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)",
          borderRadius:10, padding:"14px 18px", marginBottom:18,
          display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#f87171" }}>
              Compliance Action Required — Cannot Publish
            </div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
              Medical Council Registration Number is missing. Required by IMC Ethics Regulations 2002 before your site can go live.
            </div>
          </div>
          <button onClick={onGoToDoctorTab} style={{
            background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
            color:"#f87171", borderRadius:7, padding:"7px 16px",
            fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
            Add Reg No →
          </button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,0.02)",
            border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <span style={{ fontSize:10,
                background:`${s.color}15`, border:`1px solid ${s.color}30`,
                color:s.color, borderRadius:4, padding:"2px 7px", fontFamily:"monospace" }}>
                LIVE
              </span>
            </div>
            <div style={{ fontSize:26, fontWeight:700, color:s.color,
              fontFamily:"monospace", marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
        <UsageBar feature="appointments_monthly" label="Appointments" />
        <UsageBar feature="custom_pages" label="Pages" />
        <UsageBar feature="seo_keywords" label="SEO Keywords" />
        <UsageBar feature="storage_mb" label="Storage (MB)" />
      </div>

      <div style={{ background:"rgba(255,255,255,0.02)",
        border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
        <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:14 }}>
          TODAY'S APPOINTMENTS
        </div>
        {appts.length === 0 ? (
          <div style={{ fontSize:13, color:"#334155", textAlign:"center", padding:"20px 0" }}>
            No appointments yet. Share your site URL with patients to start receiving bookings.
          </div>
        ) : (
          appts.slice(0, 5).map((a, i) => (
            <div key={a.id || i} style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", padding:"10px 0",
              borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{a.patient_name}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{a.appt_time} · {a.service}
                  {a.branch_id && branches.find(b => b.id === a.branch_id) && (
                    <span style={{ marginLeft:6, color:"#1e88e5" }}>
                      · 📍 {branches.find(b => b.id === a.branch_id)?.name}
                    </span>
                  )}
                </div>
              </div>
              <Badge status={a.status}/>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
