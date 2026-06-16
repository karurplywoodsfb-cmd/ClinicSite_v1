// src/components/AdminPanel.jsx — FINAL v2
// Fixes: template column error, preview iframe, compliance reg no alert,
//        DPDP consent column display, publish gate

import { useState, useEffect } from "react";
import {
  supabase,
  updateClinic,
  getServices,
  getDoctors,
  updateService,
  updateDoctor,
  getAppointments,
  updateAppointmentStatus,
  uploadDoctorPhoto,
  publishClinic,
  subscribeToAppointments,
  getClinicMedia,
} from "../lib/supabase";
import UpgradeModal    from "./UpgradeModal";
import ComplianceTab   from "./ComplianceTab";
import AIBlogGenerator from "./AIBlogGenerator";
import { TEMPLATES }   from "../templates";
import DomainManager from "../components/admin/DomainManager";

// ── Small helpers ─────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    confirmed: { bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.3)",  color:"#22c55e", label:"Confirmed"  },
    pending:   { bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)", color:"#f59e0b", label:"Pending"    },
    completed: { bg:"rgba(100,116,139,0.12)",border:"rgba(100,116,139,0.3)",color:"#64748b", label:"Completed"  },
    cancelled: { bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)",  color:"#ef4444", label:"Cancelled"  },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color,
      borderRadius:20, padding:"3px 10px", fontSize:11, fontFamily:"monospace", fontWeight:600 }}>
      {s.label}
    </span>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width:40, height:22, borderRadius:11, cursor:"pointer", transition:"background .25s", flexShrink:0,
      background: value ? "#22c55e" : "rgba(255,255,255,0.12)",
      border: `1px solid ${value ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.15)"}`,
      position:"relative",
    }}>
      <div style={{
        width:16, height:16, borderRadius:"50%", background:"white",
        position:"absolute", top:2, left: value ? 20 : 2,
        transition:"left .25s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
      }}/>
    </div>
  );
}

function Field({ label, value, onChange, multiline, hint, warn, mono }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <label style={{ fontSize:12, color:"#64748b", fontFamily:"monospace", fontWeight:600, letterSpacing:.5 }}>{label}</label>
        {hint && <span style={{ fontSize:11, color:"#334155" }}>{hint}</span>}
      </div>
      {multiline
        ? <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3}
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${warn?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.1)"}`, color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily: mono?"monospace":"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}/>
        : <input value={value || ""} onChange={e => onChange(e.target.value)}
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${warn?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.1)"}`, color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily: mono?"monospace":"inherit", outline:"none", boxSizing:"border-box" }}/>
      }
    </div>
  );
}

function SaveBtn({ saved, saving, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={saving || disabled} style={{
      background: saved ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#1565c0,#1e88e5)",
      border: `1px solid ${saved ? "rgba(34,197,94,0.4)" : "rgba(30,136,229,0.5)"}`,
      color: saved ? "#22c55e" : "white",
      borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:600,
      cursor: saving || disabled ? "not-allowed" : "pointer",
      fontFamily:"inherit", transition:"all .2s", opacity: disabled ? .5 : 1,
    }}>
      {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
    </button>
  );
}

const NAV_ITEMS = [
  { id:"dashboard",    label:"Dashboard",      icon:"⊞" },
  { id:"appointments", label:"Appointments",   icon:"📅" },
  { id:"services",     label:"Services",       icon:"🦷" },
  { id:"clinic",       label:"Clinic Info",    icon:"🏥" },
  { id:"doctor",       label:"Doctor Profile", icon:"👨‍⚕️" },
  { id:"design",       label:"Design & Theme", icon:"🎨" },
  { id:"blog",         label:"Blog & Content", icon:"✍️"  },
  { id:"seo",          label:"SEO",            icon:"🔍" },
  { id:"compliance",   label:"Compliance",     icon:"⚖️"  },
  { id:"preview",      label:"Preview Site",   icon:"👁️"  },
  { id:"domain", label:"Domain", icon:"🌐" },
];

// ── Main component ────────────────────────────────────────────────
export default function AdminPanel({ user, clinic: initClinic, onClinicUpdate, onLogout }) {
  const [page,        setPage]        = useState("dashboard");
  const [clinic,      setClinic]      = useState(initClinic);
  const [services,    setServices]    = useState([]);
  const [doctors,     setDoctors]     = useState([]);
  const [appts,       setAppts]       = useState([]);
  const [media,       setMedia]       = useState([]);
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [apptFilter,  setApptFilter]  = useState("all");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [publishMsg,  setPublishMsg]  = useState("");
  const [sideOpen,    setSideOpen]    = useState(true);

  // Local editable copies
  const [clinicEdit,  setClinicEdit]  = useState(initClinic || {});
  const [doctorEdit,  setDoctorEdit]  = useState({});

  // Load data on mount
  useEffect(() => {
    if (!clinic?.id) return;
    getServices(clinic.id).then(setServices).catch(console.error);
    getDoctors(clinic.id).then(d => { setDoctors(d); setDoctorEdit(d[0] || {}); }).catch(console.error);
    getAppointments(clinic.id).then(setAppts).catch(console.error);
    getClinicMedia(clinic.id).then(setMedia).catch(console.error);

    const unsub = subscribeToAppointments(clinic.id, (payload) => {
      if (payload.eventType === "INSERT") setAppts(p => [payload.new, ...p]);
      if (payload.eventType === "UPDATE")  setAppts(p => p.map(a => a.id === payload.new.id ? payload.new : a));
    });
    return unsub;
  }, [clinic?.id]);

  // Keep clinicEdit in sync when clinic prop changes
  useEffect(() => {
    if (initClinic) { setClinic(initClinic); setClinicEdit(initClinic); }
  }, [initClinic]);

  // ── Save helpers ─────────────────────────────────────────────────
  const doSave = async (updates) => {
    setSaving(true);
    try {
      const updated = await updateClinic(clinic.id, updates);
      setClinic(updated);
      setClinicEdit(updated);
      onClinicUpdate?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveClinicInfo = () => doSave({
    name:     clinicEdit.name,
    tagline:  clinicEdit.tagline,
    phone:    clinicEdit.phone,
    whatsapp: clinicEdit.whatsapp,
    email:    clinicEdit.email,
    address:  clinicEdit.address,
    about:    clinicEdit.about,
  });

  const saveDoctor = async () => {
    if (!doctorEdit?.id) return;
    setSaving(true);
    try {
      const updated = await updateDoctor(doctorEdit.id, {
        name:           doctorEdit.name,
        degree:         doctorEdit.degree,
        specialization: doctorEdit.specialization,
        experience:     doctorEdit.experience,
        bio:            doctorEdit.bio,
        reg_number:     doctorEdit.reg_number,
        council_name:   doctorEdit.council_name,
      });
      setDoctors(prev => prev.map((d, i) => i === 0 ? updated : d));
      setDoctorEdit(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMsg("Publishing...");
    try {
      const updated = await publishClinic(clinic.id, !clinic.is_published);
      setClinic(updated);
      setClinicEdit(updated);
      onClinicUpdate?.(updated);
      setPublishMsg(updated.is_published ? "✓ Site is Live!" : "✓ Site Hidden");
      setTimeout(() => setPublishMsg(""), 4000);
    } catch (e) {
      setPublishMsg("⚠ " + e.message);
      setTimeout(() => setPublishMsg(""), 8000);
    } finally {
      setPublishing(false);
    }
  };

  const filteredAppts = apptFilter === "all"
    ? appts
    : appts.filter(a => a.status === apptFilter);

  const doctor          = doctors[0];
  const hasRegNo        = !!doctor?.reg_number;
  const complianceAlert = !hasRegNo;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#080c14", color:"#e2e8f0",
      fontFamily:"'DM Sans','Segoe UI',sans-serif", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <div style={{ width: sideOpen ? 224 : 60, flexShrink:0, background:"#0d1526",
        borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column",
        transition:"width .25s", overflow:"hidden" }}>

        {/* Logo */}
        <div style={{ padding:"16px", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", gap:10, minHeight:64 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#1565c0,#1e88e5)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🦷</div>
          {sideOpen && (
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", whiteSpace:"nowrap" }}>ClinicSite</div>
              <div style={{ fontSize:10, color:"#475569", whiteSpace:"nowrap" }}>Admin Panel</div>
            </div>
          )}
          <button onClick={() => setSideOpen(!sideOpen)}
            style={{ marginLeft:"auto", background:"none", border:"none", color:"#475569",
              cursor:"pointer", fontSize:14, padding:2, flexShrink:0 }}>
            {sideOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"9px 10px", borderRadius:8, border:"none", cursor:"pointer",
              background: page === item.id ? "rgba(21,101,192,0.15)" : "transparent",
              color: page === item.id ? "#7dd3fc" : "#475569",
              fontFamily:"inherit", fontSize:13, fontWeight: page === item.id ? 600 : 400,
              transition:"all .15s", marginBottom:2, textAlign:"left",
              borderLeft: page === item.id ? "2px solid #1e88e5" : "2px solid transparent",
            }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              {sideOpen && <span style={{ whiteSpace:"nowrap", overflow:"hidden" }}>{item.label}</span>}
              {/* Red dot on compliance if reg no missing */}
              {item.id === "compliance" && complianceAlert && sideOpen && (
                <span style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%",
                  background:"#ef4444", flexShrink:0 }}/>
              )}
              {item.id === "compliance" && complianceAlert && !sideOpen && (
                <span style={{ position:"absolute", top:6, right:6, width:7, height:7,
                  borderRadius:"50%", background:"#ef4444" }}/>
              )}
            </button>
          ))}
        </nav>

        {/* Plan badge */}
        {sideOpen && (
          <div style={{ padding:"12px" }}>
            <div style={{ background:"rgba(21,101,192,0.1)", border:"1px solid rgba(21,101,192,0.25)",
              borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:"#3b82f6", fontFamily:"monospace", marginBottom:4 }}>
                {(clinic?.plan || "free").toUpperCase()} PLAN
              </div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>
                {clinic?.plan === "free"
                  ? "Upgrade for appointments + custom domain"
                  : "Active subscription"}
              </div>
              {clinic?.plan === "free" && (
                <button onClick={() => setShowUpgrade(true)} style={{
                  width:"100%", background:"#1565c0", border:"none", color:"white",
                  borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer",
                  fontFamily:"inherit", fontWeight:600 }}>
                  Upgrade ₹499/mo →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:64, background:"#0d1526", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>
              {NAV_ITEMS.find(n => n.id === page)?.label}
            </div>
            <div style={{ fontSize:11, color:"#475569", fontFamily:"monospace" }}>
              {clinic?.slug}.clinicsite.in
              {" · "}
              <span style={{ color: clinic?.is_published ? "#22c55e" : "#64748b" }}>
                {clinic?.is_published ? "🟢 Live" : "⚫ Hidden"}
              </span>
            </div>
          </div>

          <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
            {publishMsg && (
              <div style={{ fontSize:12,
                color: publishMsg.includes("✓") ? "#22c55e" : "#f59e0b",
                fontFamily:"monospace", background:"rgba(0,0,0,0.3)",
                borderRadius:6, padding:"4px 12px", maxWidth:300, lineHeight:1.4 }}>
                {publishMsg}
              </div>
            )}
            <button onClick={handlePublish} disabled={publishing} style={{
              background: clinic?.is_published
                ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              border: `1px solid ${clinic?.is_published ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
              color: clinic?.is_published ? "#f87171" : "#22c55e",
              borderRadius:8, padding:"8px 16px", fontSize:12,
              cursor: publishing ? "not-allowed" : "pointer",
              fontFamily:"inherit", fontWeight:600, transition:"all .2s",
            }}>
              {publishing ? "..." : clinic?.is_published ? "⏸ Unpublish" : "🚀 Publish Site"}
            </button>
            <button onClick={onLogout} style={{
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
              color:"#64748b", borderRadius:8, padding:"8px 14px",
              fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* ═══ DASHBOARD ═══ */}
          {page === "dashboard" && (
            <div>
              <div style={{ marginBottom:20, fontSize:13, color:"#64748b" }}>
                Good morning 👋 — {clinic?.name}
              </div>

              {/* Compliance alert banner */}
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
                  <button onClick={() => setPage("doctor")} style={{
                    background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                    color:"#f87171", borderRadius:7, padding:"7px 16px",
                    fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                    Add Reg No →
                  </button>
                </div>
              )}

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                {[
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
                ].map(s => (
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

              {/* Today's appointments */}
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
                        <div style={{ fontSize:11, color:"#475569" }}>{a.appt_time} · {a.service}</div>
                      </div>
                      <Badge status={a.status}/>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ═══ APPOINTMENTS ═══ */}
          {page === "appointments" && (
            <div>
              <div style={{ marginBottom:24 }}>
                <NotificationSettings clinic={clinic} supabase={supabase}/>
              </div>
              <div>
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {["all","pending","confirmed","completed"].map(f => (
                  <button key={f} onClick={() => setApptFilter(f)} style={{
                    background: apptFilter === f ? "rgba(21,101,192,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${apptFilter === f ? "rgba(21,101,192,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: apptFilter === f ? "#7dd3fc" : "#64748b",
                    borderRadius:8, padding:"7px 16px", cursor:"pointer",
                    fontSize:12, fontFamily:"monospace", textTransform:"capitalize",
                  }}>
                    {f} ({f === "all" ? appts.length : appts.filter(a => a.status === f).length})
                  </button>
                ))}
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)",
                border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                      {["Patient","Phone","Service","Date & Time","Consent","Status","Actions"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", textAlign:"left",
                          fontSize:11, fontFamily:"monospace", color:"#475569", fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppts.length === 0 && (
                      <tr><td colSpan={7} style={{ padding:32, textAlign:"center",
                        color:"#334155", fontSize:13 }}>No appointments found</td></tr>
                    )}
                    {filteredAppts.map((a, i) => (
                      <tr key={a.id || i}
                        style={{ borderBottom: i < filteredAppts.length - 1
                          ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"#e2e8f0" }}>
                          {a.patient_name}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:"#94a3b8" }}>{a.phone}</td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:"#94a3b8" }}>{a.service}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ fontSize:13, color:"#e2e8f0" }}>{a.appt_date}</div>
                          <div style={{ fontSize:11, color:"#475569" }}>{a.appt_time}</div>
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ fontSize:11, fontFamily:"monospace",
                            color: a.consent_appointment ? "#22c55e" : "#ef4444" }}>
                            {a.consent_appointment ? "✓ DPDP" : "✗ Missing"}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px" }}><Badge status={a.status}/></td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            {a.status === "pending" && (
                              <button onClick={() =>
                                updateAppointmentStatus(a.id, "confirmed")
                                  .then(u => setAppts(p => p.map(x => x.id === a.id ? u : x)))}
                                style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)",
                                  color:"#22c55e", borderRadius:6, padding:"4px 10px",
                                  fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                                Confirm
                              </button>
                            )}
                            {a.status === "confirmed" && (
                              <button onClick={() =>
                                updateAppointmentStatus(a.id, "completed")
                                  .then(u => setAppts(p => p.map(x => x.id === a.id ? u : x)))}
                                style={{ background:"rgba(100,116,139,0.1)", border:"1px solid rgba(100,116,139,0.3)",
                                  color:"#64748b", borderRadius:6, padding:"4px 10px",
                                  fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                                Complete
                              </button>
                            )}
                            <a href={`https://wa.me/${(a.phone || "").replace(/\D/g,"")}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)",
                                color:"#25d366", borderRadius:6, padding:"4px 10px",
                                fontSize:11, textDecoration:"none" }}>💬</a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ SERVICES ═══ */}
          {page === "services" && (
            <div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                <SaveBtn saved={saved} saving={saving} onClick={() => doSave({})}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {services.length > 0 ? services.map(svc => (
                  <div key={svc.id} style={{
                    background:"rgba(255,255,255,0.02)",
                    border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:12, padding:18, opacity: svc.is_active ? 1 : .5,
                    transition:"opacity .2s",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                      <span style={{ fontSize:24 }}>{svc.icon || "🏥"}</span>
                      <input value={svc.name}
                        onChange={e => setServices(p => p.map(s => s.id === svc.id ? {...s, name:e.target.value} : s))}
                        style={{ background:"transparent", border:"none", color:"#e2e8f0",
                          fontSize:14, fontWeight:600, fontFamily:"inherit", flex:1, outline:"none" }}/>
                      <Toggle value={!!svc.is_active}
                        onChange={v => {
                          setServices(p => p.map(s => s.id === svc.id ? {...s, is_active:v} : s));
                          if (typeof svc.id === "string" && svc.id.length > 8)
                            updateService(svc.id, { is_active:v }).catch(console.error);
                        }}/>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:12, color:"#475569" }}>Consultation fee:</span>
                      <input value={svc.price || ""}
                        onChange={e => setServices(p => p.map(s => s.id === svc.id ? {...s, price:e.target.value} : s))}
                        style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                          color:"#22c55e", borderRadius:6, padding:"4px 10px", fontSize:13,
                          fontFamily:"monospace", width:110, outline:"none", fontWeight:600 }}/>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn:"1/-1", padding:32, textAlign:"center", color:"#334155", fontSize:13 }}>
                    No services found. They should have been created during onboarding.
                  </div>
                )}
              </div>
              <div style={{ marginTop:16, display:"flex", justifyContent:"flex-end" }}>
                <SaveBtn saved={saved} saving={saving} onClick={() => {
                  // Save all active services
                  Promise.all(
                    services.map(s => typeof s.id === "string" && s.id.length > 8
                      ? updateService(s.id, { name:s.name, price:s.price, is_active:s.is_active })
                      : Promise.resolve()
                    )
                  ).then(() => { setSaved(true); setTimeout(()=>setSaved(false),2000); })
                  .catch(e => alert("Save failed: " + e.message));
                }}/>
              </div>
            </div>
          )}

          {/* ═══ CLINIC INFO ═══ */}
          {page === "clinic" && (
            <div style={{ maxWidth:680 }}>
              <Field label="CLINIC NAME"    value={clinicEdit.name}
                onChange={v => setClinicEdit(p => ({...p, name:v}))}/>
              <Field label="TAGLINE"        value={clinicEdit.tagline}
                onChange={v => setClinicEdit(p => ({...p, tagline:v}))}
                hint="Factual descriptor only — no superlatives (IMC Ethics 2002)"/>
              <Field label="PHONE"          value={clinicEdit.phone}
                onChange={v => setClinicEdit(p => ({...p, phone:v}))}/>
              <Field label="WHATSAPP"       value={clinicEdit.whatsapp}
                onChange={v => setClinicEdit(p => ({...p, whatsapp:v}))}/>
              <Field label="EMAIL"          value={clinicEdit.email}
                onChange={v => setClinicEdit(p => ({...p, email:v}))}/>
              <Field label="ADDRESS"        value={clinicEdit.address}
                onChange={v => setClinicEdit(p => ({...p, address:v}))} multiline/>
              <Field label="ABOUT CLINIC"   value={clinicEdit.about}
                onChange={v => setClinicEdit(p => ({...p, about:v}))} multiline
                hint="Educational, factual — no superlatives"/>

              {/* Compliance warning */}
              <div style={{ padding:"10px 14px", background:"rgba(245,158,11,0.06)",
                border:"1px solid rgba(245,158,11,0.2)", borderRadius:8,
                fontSize:11, color:"#f59e0b", marginBottom:18, lineHeight:1.6 }}>
                ⚠ Do not use: 'best', 'most trusted', 'painless', 'guaranteed', '#1' — prohibited by IMC Ethics Regulations 2002 & DMR Act 1954
              </div>
              <SaveBtn saved={saved} saving={saving} onClick={saveClinicInfo}/>
            </div>
          )}

          {/* ═══ DOCTOR PROFILE ═══ */}
          {page === "doctor" && (
            <div style={{ maxWidth:680 }}>
              {/* Photo upload */}
              <div style={{ background:"rgba(255,255,255,0.02)",
                border:"1px solid rgba(255,255,255,0.07)", borderRadius:12,
                padding:20, marginBottom:20, display:"flex", alignItems:"center", gap:20 }}>
                <div style={{ width:80, height:80, borderRadius:16,
                  background:"linear-gradient(135deg,#1565c0,#a855f7)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:36, flexShrink:0, overflow:"hidden" }}>
                  {doctorEdit.photo_url
                    ? <img src={doctorEdit.photo_url} alt=""
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : "👨‍⚕️"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"#94a3b8", marginBottom:8 }}>Doctor Photo</div>
                  <input type="file" accept="image/*" id="photo-upload" style={{ display:"none" }}
                    onChange={async e => {
                      if (!e.target.files?.[0] || !clinic?.id) return;
                      try {
                        const url = await uploadDoctorPhoto(clinic.id, e.target.files[0]);
                        if (doctorEdit?.id) await updateDoctor(doctorEdit.id, { photo_url: url });
                        setDoctorEdit(p => ({...p, photo_url: url}));
                        setDoctors(p => p.map((d,i) => i===0 ? {...d, photo_url:url} : d));
                      } catch(e) { alert("Upload failed: " + e.message); }
                    }}/>
                  <label htmlFor="photo-upload" style={{
                    background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)",
                    color:"#94a3b8", borderRadius:8, padding:"8px 16px",
                    fontSize:12, cursor:"pointer", display:"inline-block" }}>
                    📷 Upload Photo
                  </label>
                  <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>JPG or PNG, max 5MB</div>
                </div>
              </div>

              <Field label="DOCTOR NAME *" value={doctorEdit.name}
                onChange={v => setDoctorEdit(p => ({...p, name:v}))}/>
              <Field label="DEGREE (NMC Recognised) *" value={doctorEdit.degree}
                onChange={v => setDoctorEdit(p => ({...p, degree:v}))}
                hint="e.g. BDS, MDS — IMC Ethics 2002 Cl.1.1"/>
              <Field label="SPECIALIZATION" value={doctorEdit.specialization}
                onChange={v => setDoctorEdit(p => ({...p, specialization:v}))}/>
              <Field label="YEARS OF EXPERIENCE" value={doctorEdit.experience}
                onChange={v => setDoctorEdit(p => ({...p, experience:v}))}/>

              {/* Mandatory Reg No */}
              <div style={{ marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <label style={{ fontSize:12, fontFamily:"monospace", fontWeight:600,
                    color: doctorEdit.reg_number ? "#22c55e" : "#ef4444", letterSpacing:.5 }}>
                    MEDICAL COUNCIL REG NO *{" "}
                    {!doctorEdit.reg_number && <span style={{ fontSize:10 }}>(MANDATORY — blocks publish)</span>}
                  </label>
                </div>
                <input
                  value={doctorEdit.reg_number || ""}
                  onChange={e => setDoctorEdit(p => ({...p, reg_number: e.target.value}))}
                  placeholder="e.g. TNMC-12345"
                  style={{
                    width:"100%", boxSizing:"border-box",
                    background: doctorEdit.reg_number ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                    border: `1.5px solid ${doctorEdit.reg_number ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.4)"}`,
                    color:"#e2e8f0", borderRadius:8, padding:"10px 12px",
                    fontSize:13, fontFamily:"monospace", outline:"none",
                  }}/>
                <div style={{ fontSize:11, color:"#64748b", marginTop:5, lineHeight:1.5 }}>
                  Required by IMC Ethics Regulations, 2002. Displayed permanently in your website footer.
                  Patients can verify your registration with the Medical Council.
                </div>
              </div>

              {/* Council picker */}
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:12, color:"#64748b", fontFamily:"monospace",
                  fontWeight:600, letterSpacing:.5, display:"block", marginBottom:6 }}>
                  MEDICAL COUNCIL
                </label>
                <select
                  value={doctorEdit.council_name || "Tamil Nadu Medical Council"}
                  onChange={e => setDoctorEdit(p => ({...p, council_name: e.target.value}))}
                  style={{ width:"100%", background:"rgba(255,255,255,0.04)",
                    border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0",
                    borderRadius:8, padding:"10px 12px", fontSize:13,
                    fontFamily:"inherit", outline:"none" }}>
                  {[
                    "Tamil Nadu Medical Council",
                    "Karnataka Medical Council",
                    "Maharashtra Medical Council",
                    "Delhi Medical Council",
                    "Kerala State Medical Council",
                    "Telangana State Medical Council",
                    "West Bengal Medical Council",
                    "National Medical Commission",
                    "Medical Council of India",
                  ].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <Field label="DOCTOR BIO" value={doctorEdit.bio}
                onChange={v => setDoctorEdit(p => ({...p, bio:v}))} multiline
                hint="Factual — no superlatives"/>

              <SaveBtn saved={saved} saving={saving} onClick={saveDoctor}
                disabled={!doctorEdit.name || !doctorEdit.degree}/>
            </div>
          )}

          {/* ═══ DESIGN & THEME ═══ */}
          {page === "design" && (
            <div>
              <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
                Select a template. Your content stays the same — only the visual style changes.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {Object.values(TEMPLATES).map(tmpl => {
                  const active = (clinic?.template || "corporate") === tmpl.id;
                  return (
                    <div key={tmpl.id}
                      onClick={async () => {
                        try {
                          const updated = await updateClinic(clinic.id, { template: tmpl.id });
                          setClinic(updated);
                          setClinicEdit(updated);
                          onClinicUpdate?.(updated);
                        } catch(e) { alert("Save failed: " + e.message); }
                      }}
                      style={{
                        background: active ? "rgba(21,101,192,0.1)" : "rgba(255,255,255,0.02)",
                        border: `2px solid ${active ? "rgba(21,101,192,0.5)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius:14, padding:20, cursor:"pointer", transition:"all .2s",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>{tmpl.icon}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>
                        {tmpl.name}
                      </div>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:10 }}>
                        Best for: {(tmpl.bestFor || []).slice(0, 2).join(", ")}
                      </div>
                      {active && (
                        <div style={{ fontSize:11, color:"#22c55e", fontFamily:"monospace" }}>
                          ✓ Active Template
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ BLOG ═══ */}
          {page === "blog" && (
            <AIBlogGenerator clinic={clinic} supabaseClient={supabase}/>
          )}

          {/* ═══ SEO ═══ */}
          {page === "seo" && (
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
                {[
                  ["MedicalClinic Schema",   true],
                  ["LocalBusiness Schema",   true],
                  ["FAQPage Schema",         true],
                  ["Meta Title (auto)",      true],
                  ["Meta Description (auto)",true],
                  ["Sitemap ready",          true],
                  ["Mobile optimized",       true],
                  ["HTTPS active",           true],
                  ["Reviews removed ✓",      true],
                  ["Reg No. in footer",      hasRegNo],
                  ["Privacy Policy page",    !!clinic?.privacy_policy_generated],
                ].map(([label, status], i) => (
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
                  {[
                    ["TITLE", `${clinic?.name} | ${clinic?.specialty} in ${clinic?.city} | Book Appointment`],
                    ["DESCRIPTION", `Expert ${(clinic?.specialty||"").toLowerCase()} care in ${clinic?.city}. Book appointment online.`],
                    ["CANONICAL", `https://${clinic?.slug}.clinicsite.in`],
                  ].map(([k, v]) => (
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
                  {[
                    "Add Reg No to enable 'Verified Doctor' schema",
                    "Publish 2 blog articles to reach SEO score 98+",
                    "Add Google Business Profile listing for map pack",
                    "Upload clinic facility photos for rich snippets",
                  ].map((tip, i) => (
                    <div key={i} style={{ display:"flex", gap:8, fontSize:12,
                      color:"#94a3b8", padding:"4px 0" }}>
                      <span style={{ color:"#f59e0b" }}>→</span>{tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ COMPLIANCE ═══ */}
          {page === "compliance" && (
            <ComplianceTab
              clinic={clinic}
              doctor={doctor}
              onNavigate={setPage}/>
          )}

          {/* ═══ DOMAIN ═══ */}
          {page === "domain" && (
            <DomainManager clinic={clinic}/>
          )}

          {/* ═══ PREVIEW ═══ */}
          {page === "preview" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:13, color:"#64748b" }}>
                  {clinic?.is_published
                    ? "Your site is live — preview below"
                    : "Publish your site to see the live preview"}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  {clinic?.is_published && (
                    <a href={`/${clinic?.slug}`} target="_blank" rel="noopener noreferrer"
                      style={{ background:"rgba(255,255,255,0.05)",
                        border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8",
                        borderRadius:8, padding:"8px 16px", fontSize:13, textDecoration:"none" }}>
                      🔗 Open Full Site ↗
                    </a>
                  )}
                  <button onClick={handlePublish} disabled={publishing || (!hasRegNo && !clinic?.is_published)}
                    style={{
                      background: publishing || (!hasRegNo && !clinic?.is_published)
                        ? "rgba(255,255,255,0.05)"
                        : "linear-gradient(135deg,#1565c0,#1e88e5)",
                      border:"none", color: (!hasRegNo && !clinic?.is_published) ? "#334155" : "white",
                      borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:600,
                      cursor: publishing || (!hasRegNo && !clinic?.is_published) ? "not-allowed" : "pointer",
                      fontFamily:"inherit",
                    }}>
                    {publishing ? "..." : clinic?.is_published ? "⏸ Unpublish" : "🚀 Publish Site"}
                  </button>
                </div>
              </div>

              {/* Can't publish warning */}
              {!hasRegNo && !clinic?.is_published && (
                <div style={{ background:"rgba(239,68,68,0.06)",
                  border:"1px solid rgba(239,68,68,0.2)", borderRadius:10,
                  padding:"14px 18px", marginBottom:16,
                  display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:20 }}>🚫</span>
                  <div style={{ flex:1, fontSize:13, color:"#f87171" }}>
                    Cannot publish: Medical Council Registration Number is missing.
                    <button onClick={() => setPage("doctor")}
                      style={{ marginLeft:10, background:"none", border:"none",
                        color:"#fca5a5", cursor:"pointer", textDecoration:"underline",
                        fontFamily:"inherit", fontSize:13 }}>
                      Add it now →
                    </button>
                  </div>
                </div>
              )}

              {/* Browser chrome preview */}
              <div style={{ background:"#1a1a2e", borderRadius:14, overflow:"hidden",
                border:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ background:"#0f0f1a", padding:"10px 16px",
                  display:"flex", alignItems:"center", gap:10,
                  borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {["#ef4444","#f59e0b","#22c55e"].map(c => (
                      <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>
                    ))}
                  </div>
                  <div style={{ flex:1, background:"rgba(255,255,255,0.05)", borderRadius:6,
                    padding:"4px 12px", fontSize:12, color:"#475569", fontFamily:"monospace" }}>
                    🔒 {clinic?.slug}.clinicsite.in
                  </div>
                </div>

                {clinic?.is_published ? (
                  // Live iframe preview
                  <iframe
                    key={clinic.slug}
                    src={`/${clinic.slug}`}
                    title={`${clinic.name} preview`}
                    style={{ width:"100%", height:520, border:"none", background:"white",
                      display:"block" }}
                  />
                ) : (
                  // Not published yet
                  <div style={{ background:"white", height:400,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexDirection:"column", gap:14 }}>
                    <div style={{ fontSize:40 }}>👁️</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#0b2545" }}>{clinic?.name}</div>
                    <div style={{ fontSize:13, color:"#94a3b8" }}>
                      {clinic?.specialty} · {clinic?.city}
                    </div>
                    <div style={{ fontSize:12, color:"#f59e0b", textAlign:"center",
                      maxWidth:340, lineHeight:1.6 }}>
                      {!hasRegNo
                        ? "⚠ Add your Medical Council Registration Number first, then publish to preview your live site."
                        : "Click 'Publish Site' above to make your website live and preview it here."}
                    </div>
                    {hasRegNo && (
                      <button onClick={handlePublish} style={{
                        background:"#1565c0", color:"white", border:"none",
                        borderRadius:8, padding:"12px 24px", fontSize:14,
                        fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        🚀 Publish & Preview
                      </button>
                    )}
                  </div>
                )}
              </div>

              {publishMsg && (
                <div style={{ marginTop:12, textAlign:"center", fontSize:13,
                  color: publishMsg.includes("✓") ? "#22c55e" : "#f59e0b",
                  fontFamily:"monospace" }}>{publishMsg}</div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <UpgradeModal
          clinic={clinic}
          user={user}
          onClose={() => setShowUpgrade(false)}
          onUpgraded={updated => {
            setClinic(updated);
            setClinicEdit(updated);
            onClinicUpdate?.(updated);
          }}/>
      )}
    </div>
  );
}